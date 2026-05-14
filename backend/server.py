"""
Violence Detection System — FastAPI Backend
Wraps the MobileNetV2 violence detection model and serves results to the React UI
via REST API and WebSocket for real-time streaming.
"""

import os
import sys
import json
import time
import uuid
import base64
import asyncio
import traceback
from pathlib import Path
from datetime import datetime
from collections import deque

import cv2
import numpy as np
import pytz

try:
    import telepot
    TELEPOT_AVAILABLE = True
except ImportError:
    TELEPOT_AVAILABLE = False
    print("[WARN] telepot not installed — Telegram alerts disabled")

from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ─── Resolve project paths ───────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "model" / "modelnew.h5"
UPLOAD_DIR = PROJECT_ROOT / "backend" / "uploads"
OUTPUT_DIR = PROJECT_ROOT / "output"
HISTORY_FILE = PROJECT_ROOT / "backend" / "history.json"
ALERT_IMAGE_PATH = PROJECT_ROOT / "backend" / "alert_frame.jpg"

# Violence classification: if >= this many frames are violent, the video is violent
# (matches the original notebook logic where 10+ detections = violent)
VIOLENCE_FRAME_THRESHOLD = 10

# Telegram bot config (same as violence_pred.py)
TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'
TELEGRAM_CHAT_ID = '-1002396872795'
ALERT_LOCATION = 'Pune'

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ─── History persistence helpers ─────────────────────────────────────────────
def _load_history() -> list:
    """Load detection history from JSON file."""
    if HISTORY_FILE.exists():
        try:
            return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []
    return []


def _save_history(history: list):
    """Persist detection history to JSON file."""
    HISTORY_FILE.write_text(json.dumps(history, indent=2, ensure_ascii=False), encoding="utf-8")

# ─── Load TensorFlow + model (once at startup) ───────────────────────────────
print("[BACKEND] Loading TensorFlow...")
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

from tensorflow.keras.models import load_model
from tensorflow.keras.layers import DepthwiseConv2D as TFDepthwiseConv2D


class PatchedDepthwiseConv2D(TFDepthwiseConv2D):
    @classmethod
    def from_config(cls, config):
        config = dict(config)
        config.pop("groups", None)
        return super().from_config(config)


print(f"[BACKEND] Loading model from {MODEL_PATH} ...")
model = load_model(str(MODEL_PATH), custom_objects={"DepthwiseConv2D": PatchedDepthwiseConv2D})
print("[BACKEND] Model loaded successfully!")

# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(title="Violence Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Map video_id → original filename (in-memory, populated at upload)
_upload_filenames: dict[str, str] = {}

# Serve processed output videos as static files
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")


# ─── Upload endpoint ─────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file and return a unique video_id for detection."""
    ext = Path(file.filename).suffix or ".mp4"
    video_id = str(uuid.uuid4())[:8]
    save_path = UPLOAD_DIR / f"{video_id}{ext}"

    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Remember the original filename for history
    _upload_filenames[video_id] = file.filename

    # Read video metadata
    cap = cv2.VideoCapture(str(save_path))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = total_frames / fps if fps > 0 else 0
    cap.release()

    return {
        "video_id": video_id,
        "filename": file.filename,
        "path": str(save_path),
        "total_frames": total_frames,
        "fps": round(fps, 2),
        "width": width,
        "height": height,
        "duration": round(duration, 2),
    }


# ─── WebSocket: Real-time detection ──────────────────────────────────────────
@app.websocket("/ws/detect/{video_id}")
async def detect_violence(ws: WebSocket, video_id: str):
    """
    WebSocket endpoint that processes a video frame-by-frame and streams
    real-time predictions back to the client.

    Messages sent to client:
      - {"type": "status", "message": "..."} — status updates
      - {"type": "frame", ...} — per-frame prediction with thumbnail
      - {"type": "complete", ...} — final summary when done
      - {"type": "error", "message": "..."} — if something goes wrong
    """
    await ws.accept()
    print(f"[WS] Client connected for video_id={video_id}")

    try:
        # Find the uploaded file
        video_path = None
        for f in UPLOAD_DIR.iterdir():
            if f.stem == video_id:
                video_path = f
                break

        if not video_path or not video_path.exists():
            await ws.send_json({"type": "error", "message": f"Video {video_id} not found"})
            await ws.close()
            return

        await ws.send_json({"type": "status", "message": "Opening video..."})

        cap = cv2.VideoCapture(str(video_path))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Setup output video writer
        output_filename = f"output_{video_id}.avi"
        output_path = OUTPUT_DIR / output_filename
        fourcc = cv2.VideoWriter_fourcc(*"MJPG")
        writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height), True)

        Q = deque(maxlen=128)
        frame_count = 0
        processed_count = 0
        violent_count = 0
        frame_skip = 2  # Process every 2nd frame for speed
        frame_results = []  # Store all results

        await ws.send_json({
            "type": "status",
            "message": "Model loaded. Starting detection...",
            "total_frames": total_frames,
            "fps": round(fps, 2),
        })

        while True:
            grabbed, frame = cap.read()
            if not grabbed:
                break

            frame_count += 1

            if frame_count % frame_skip != 0:
                # Still write skipped frames to output (un-annotated)
                writer.write(frame)
                continue

            processed_count += 1
            output_frame = frame.copy()

            # Preprocess for model
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            resized = cv2.resize(rgb, (128, 128)).astype("float32") / 255.0
            resized = resized.reshape(1, 128, 128, 3)

            # Predict
            preds = model.predict(resized, verbose=0)[0]
            Q.append(preds)
            avg_pred = float(np.array(Q).mean(axis=0)[0])
            raw_conf = float(preds[0])
            is_violent = raw_conf > 0.50

            if is_violent:
                violent_count += 1
                # Save the first violent frame for the Telegram alert photo
                if violent_count == 1:
                    cv2.imwrite(str(ALERT_IMAGE_PATH), output_frame)

            # Annotate output frame
            color = (0, 0, 255) if is_violent else (0, 255, 0)
            label_text = f"Violence: {is_violent} ({raw_conf:.2f})"
            cv2.putText(output_frame, label_text, (35, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
            writer.write(output_frame)

            # Calculate time position
            time_sec = frame_count / fps if fps > 0 else 0
            minutes = int(time_sec // 60)
            seconds = int(time_sec % 60)
            time_str = f"{minutes}:{seconds:02d}"

            # Create a small thumbnail (every 5th processed frame) for the UI
            thumbnail_b64 = None
            if processed_count % 5 == 0:
                thumb = cv2.resize(output_frame, (320, 180))
                _, buf = cv2.imencode(".jpg", thumb, [cv2.IMWRITE_JPEG_QUALITY, 60])
                thumbnail_b64 = base64.b64encode(buf).decode("utf-8")

            # Store result
            frame_result = {
                "frame": frame_count,
                "time": time_str,
                "violence": is_violent,
                "confidence": round(raw_conf, 4),
                "avg_confidence": round(avg_pred, 4),
            }
            frame_results.append(frame_result)

            # Send frame result to client
            progress = round(frame_count / total_frames * 100, 1) if total_frames > 0 else 0
            msg = {
                "type": "frame",
                "frame": frame_count,
                "total_frames": total_frames,
                "progress": progress,
                "time": time_str,
                "violence": is_violent,
                "confidence": round(raw_conf, 4),
                "avg_confidence": round(avg_pred, 4),
                "violent_count": violent_count,
                "processed_count": processed_count,
            }
            if thumbnail_b64:
                msg["thumbnail"] = thumbnail_b64

            await ws.send_json(msg)

            # Small yield to keep the event loop responsive
            await asyncio.sleep(0.01)

        # Cleanup
        cap.release()
        writer.release()

        # Compute final summary
        total_processed = len(frame_results)
        violent_frames = sum(1 for r in frame_results if r["violence"])
        non_violent_frames = total_processed - violent_frames
        violent_pct = round(violent_frames / total_processed * 100, 1) if total_processed > 0 else 0
        non_violent_pct = round(100 - violent_pct, 1)
        avg_confidence = round(
            sum(r["confidence"] for r in frame_results if r["violence"]) / violent_frames, 4
        ) if violent_frames > 0 else 0
        peak_confidence = max(
            (r["confidence"] for r in frame_results if r["violence"]), default=0
        )

        # Detect violence segments (consecutive violent frames)
        segments = []
        seg_start = None
        seg_confs = []
        for r in frame_results:
            if r["violence"]:
                if seg_start is None:
                    seg_start = r
                seg_confs.append(r["confidence"])
            else:
                if seg_start is not None:
                    segments.append({
                        "startTime": seg_start["time"],
                        "endTime": frame_results[frame_results.index(r) - 1]["time"],
                        "confidence": round(sum(seg_confs) / len(seg_confs), 4),
                        "startFrame": seg_start["frame"],
                    })
                    seg_start = None
                    seg_confs = []
        # Handle segment that runs to end
        if seg_start is not None:
            segments.append({
                "startTime": seg_start["time"],
                "endTime": frame_results[-1]["time"],
                "confidence": round(sum(seg_confs) / len(seg_confs), 4),
                "startFrame": seg_start["frame"],
            })

        duration_sec = total_frames / fps if fps > 0 else 0
        dur_min = int(duration_sec // 60)
        dur_sec = int(duration_sec % 60)

        # Classify using same logic as notebook: >= 10 violent frames = Violent
        is_video_violent = violent_frames >= VIOLENCE_FRAME_THRESHOLD

        # ── Telegram alert ────────────────────────────────────────────
        alert_sent = False
        if is_video_violent and TELEPOT_AVAILABLE:
            try:
                IST = pytz.timezone('Asia/Kolkata')
                time_now = datetime.now(IST)
                bot = telepot.Bot(TELEGRAM_BOT_TOKEN)
                bot.sendMessage(
                    TELEGRAM_CHAT_ID,
                    f"VIOLENCE ALERT!! \nLOCATION: {ALERT_LOCATION} \nTIME: {time_now}"
                )
                if ALERT_IMAGE_PATH.exists():
                    with open(str(ALERT_IMAGE_PATH), 'rb') as photo:
                        bot.sendPhoto(TELEGRAM_CHAT_ID, photo=photo)
                alert_sent = True
                print(f"[ALERT] Telegram alert sent for {video_id}!")
            except Exception as e:
                print(f"[ALERT] Failed to send Telegram alert: {e}")

        summary = {
            "type": "complete",
            "output_video": f"/output/{output_filename}",
            "summary": {
                "totalFrames": total_frames,
                "processedFrames": total_processed,
                "violentFrames": violent_frames,
                "nonViolentFrames": non_violent_frames,
                "violentPercentage": violent_pct,
                "nonViolentPercentage": non_violent_pct,
                "averageConfidence": avg_confidence,
                "peakConfidence": round(peak_confidence, 4),
                "duration": f"{dur_min}:{dur_sec:02d}",
                "fps": round(fps, 2),
                "isViolent": is_video_violent,
                "alertSent": alert_sent,
            },
            "segments": segments,
            "frameResults": frame_results,
        }

        await ws.send_json(summary)
        print(f"[WS] Complete: {video_id} — {'Violent' if is_video_violent else 'Non-Violent'}")

        # ── Auto-save to history ──────────────────────────────────────
        original_filename = _upload_filenames.pop(video_id, video_path.name)
        history_entry = {
            "id": video_id,
            "filename": original_filename,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "result": "Violent" if is_video_violent else "Non-Violent",
            "confidence": round(avg_confidence * 100) if violent_frames > 0 else round((1 - avg_confidence) * 100),
            "duration": f"{dur_min}:{dur_sec:02d}",
            "violentPercentage": violent_pct,
            "nonViolentPercentage": non_violent_pct,
            "totalFrames": total_frames,
            "violentFrames": violent_frames,
            "peakConfidence": round(peak_confidence, 4),
            "outputVideo": f"/output/{output_filename}",
            "alertSent": alert_sent,
        }
        history = _load_history()
        history.insert(0, history_entry)
        _save_history(history)
        print(f"[HISTORY] Saved entry for {video_id}")

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected for video_id={video_id}")
    except Exception as e:
        traceback.print_exc()
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except:
            pass


# ─── History endpoints ────────────────────────────────────────────────────────
@app.get("/api/history")
async def get_history():
    """Return all past detection results, newest first."""
    return _load_history()


@app.delete("/api/history/{entry_id}")
async def delete_history_entry(entry_id: str):
    """Delete a single history entry by its video_id."""
    history = _load_history()
    history = [h for h in history if h["id"] != entry_id]
    _save_history(history)
    return {"status": "ok", "remaining": len(history)}


@app.delete("/api/history")
async def clear_history():
    """Delete all history."""
    _save_history([])
    return {"status": "ok"}


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}


if __name__ == "__main__":
    import uvicorn
    print("[BACKEND] Starting server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)

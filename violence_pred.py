"""
Violence Detection System
Detects violence in video files using a pre-trained deep learning model
"""

from tensorflow.keras.models import load_model
from tensorflow.keras.layers import DepthwiseConv2D as TFDepthwiseConv2D
from collections import deque
import numpy as np
import cv2
import os
from datetime import datetime
import telepot
import pytz


class PatchedDepthwiseConv2D(TFDepthwiseConv2D):
    @classmethod
    def from_config(cls, config):
        config = dict(config)
        config.pop('groups', None)
        return super().from_config(config)


def getTime():
    """Get current time in IST timezone"""
    IST = pytz.timezone('Asia/Kolkata')
    timeNow = datetime.now(IST)
    return timeNow


def print_results(video, output_filename='v_output.avi', limit=None, frame_skip=1):
    """
    Process video and detect violence
    
    Args:
        video: Path to input video file
        output_filename: Name of output video file
        limit: Maximum number of frames to process (None for all)
        frame_skip: Process every Nth frame (1 = process all frames)
    """
    if frame_skip == 0:
        frame_skip = 1

    # Create output folder locally if it doesn't exist
    output_folder = './output'
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    print("Loading model ...")
    try:
        model_path = './model/modelnew.h5'
        model = load_model(model_path, custom_objects={'DepthwiseConv2D': PatchedDepthwiseConv2D})
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    Q = deque(maxlen=128)
    vs = cv2.VideoCapture(video)
    writer = None
    (W, H) = (None, None)
    frame_count = 0

    # Initialize variables for alerting
    trueCount = 0
    imageSaved = 0
    sendAlert = 0
    filename = 'savedImage.jpg'
    location = "Jaipur"  # Location

    print(f"Processing video: {video}")
    print(f"Frame skip: {frame_skip}")

    while True:
        (grabbed, frame) = vs.read()

        if not grabbed:
            print("[INFO] End of video stream or cannot grab frame.")
            break

        if frame_count % frame_skip != 0:
            frame_count += 1
            continue

        frame_count += 1

        if W is None or H is None:
            (H, W) = frame.shape[:2]

        output = frame.copy()
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame = cv2.resize(frame, (128, 128)).astype("float32")
        frame = frame.reshape(128, 128, 3) / 255

        preds = model.predict(np.expand_dims(frame, axis=0), verbose=0)[0]
        Q.append(preds)

        results = np.array(Q).mean(axis=0)
        i = (preds > 0.50)[0]
        label = i

        text_color = (0, 255, 0)  # Green for non-violence
        if label:
            text_color = (0, 0, 255)  # Red for violence
            trueCount += 1

        text = "Violence: {}".format(label)
        FONT = cv2.FONT_HERSHEY_SIMPLEX

        cv2.putText(output, text, (35, 50), FONT, 1.25, text_color, 3)

        if writer is None:
            fourcc = cv2.VideoWriter_fourcc(*"MJPG")
            output_path = os.path.join(output_folder, output_filename)
            writer = cv2.VideoWriter(output_path, fourcc, 30, (W, H), True)
            if writer is None:
                print("[ERROR] Could not initialize video writer.")
                break
            print(f"Writing output to: {output_path}")

        writer.write(output)

        # Display the frame
        cv2.imshow('Violence Detection', output)
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord("q"):
            print("[INFO] User requested exit")
            break

        # Trigger the alert if violence is detected 10 times
        if trueCount == 10 and sendAlert == 0:
            if label and imageSaved == 0:
                cv2.imwrite(filename, output)
                imageSaved = 1
                print(f"[ALERT] Violence detected! Image saved: {filename}")

            try:
                timeMoment = getTime()
                bot = telepot.Bot('YOUR_TELEGRAM_BOT_TOKEN')
                bot.sendMessage('-1002396872795', f"VIOLENCE ALERT!! \nLOCATION: {location} \nTIME: {timeMoment}")
                bot.sendPhoto('-1002396872795', photo=open(filename, 'rb'))
                sendAlert = 1
                print("[ALERT] Telegram alert sent successfully!")
            except Exception as e:
                print(f"Error sending alert: {e}")

        if frame_count % 30 == 0:
            print(f"[INFO] Processed {frame_count} frames, Violence count: {trueCount}")

    print("[INFO] Cleaning up...")
    print(f"[INFO] Total frames processed: {frame_count}")
    print(f"[INFO] Total violence detections: {trueCount}")
    
    if writer is not None:
        writer.release()
    vs.release()
    cv2.destroyAllWindows()
    
    print("[INFO] Processing complete!")


if __name__ == "__main__":
    # Process video files from the input folder
    input_folder = './input'
    video_files = sorted([
        os.path.join(input_folder, name)
        for name in os.listdir(input_folder)
        if name.lower().endswith('.mp4')
    ])
    
    if not video_files:
        print(f"[WARNING] No video files found in: {input_folder}")
    else:
        for i, V_path in enumerate(video_files):
            if os.path.exists(V_path):
                print(f"\n{'='*60}")
                print(f"Processing video {i+1}: {V_path}")
                print(f"{'='*60}")
                output_name = f'output_v{i+1}.avi'
                print_results(V_path, frame_skip=2, output_filename=output_name)
            else:
                print(f"[WARNING] Video not found: {V_path}")
    
    print("\n[INFO] All videos processed!")

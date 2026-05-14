import { useState, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import VideoUpload from './components/VideoUpload';
import OutputPanel from './components/OutputPanel';
import TimelineBar from './components/TimelineBar';
import AnalyticsCharts from './components/AnalyticsCharts';
import HistoryPanel from './components/HistoryPanel';
import { Play, SlidersHorizontal, Eye, EyeOff } from 'lucide-react';

const API_BASE = '';
const WS_BASE = `ws://${window.location.host}`;

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [filterMode, setFilterMode] = useState('all');

  // Real-time processing state
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [liveFrame, setLiveFrame] = useState(null); // live thumbnail
  const [liveStats, setLiveStats] = useState(null);  // live frame stats
  const [detectionData, setDetectionData] = useState(null); // final complete data

  const wsRef = useRef(null);

  const handleRunDetection = useCallback(async () => {
    if (!selectedVideo) return;

    setIsProcessing(true);
    setResult(null);
    setDetectionData(null);
    setProgress(0);
    setStatusMessage('Uploading video...');
    setLiveFrame(null);
    setLiveStats(null);

    try {
      // Step 1: Upload the video to the backend
      const formData = new FormData();
      formData.append('file', selectedVideo);

      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.statusText}`);
      }

      const uploadData = await uploadRes.json();
      const videoId = uploadData.video_id;

      setStatusMessage(`Video uploaded. Connecting to model...`);

      // Step 2: Open WebSocket for real-time detection
      const ws = new WebSocket(`${WS_BASE}/ws/detect/${videoId}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'status':
            setStatusMessage(msg.message);
            break;

          case 'frame':
            setProgress(msg.progress);
            setStatusMessage(
              `Processing frame ${msg.frame}/${msg.total_frames} (${msg.progress}%)`
            );
            setLiveStats({
              violence: msg.violence,
              confidence: msg.confidence,
              avgConfidence: msg.avg_confidence,
              violentCount: msg.violent_count,
              processedCount: msg.processed_count,
              frame: msg.frame,
              totalFrames: msg.total_frames,
              time: msg.time,
            });
            if (msg.thumbnail) {
              setLiveFrame(`data:image/jpeg;base64,${msg.thumbnail}`);
            }
            break;

          case 'complete':
            setIsProcessing(false);
            setStatusMessage('Detection complete!');

            // Build result for the output panel
            const summary = msg.summary;
            const isViolent = summary.isViolent;
            setResult({
              label: isViolent ? 'Violent' : 'Non-Violent',
              confidence: isViolent
                ? Math.round(summary.averageConfidence * 100)
                : Math.round((1 - summary.averageConfidence) * 100),
              outputVideo: msg.output_video,
              alertSent: summary.alertSent,
            });

            // Build full detection data for the results page
            setDetectionData({
              frameResults: msg.frameResults.map((fr) => ({
                frame: fr.frame,
                time: fr.time,
                violence: fr.violence,
                confidence: fr.confidence,
              })),
              summary: summary,
              segments: msg.segments,
            });

            setActiveTab('results');
            ws.close();
            break;

          case 'error':
            setIsProcessing(false);
            setStatusMessage(`Error: ${msg.message}`);
            ws.close();
            break;

          default:
            break;
        }
      };

      ws.onerror = () => {
        setIsProcessing(false);
        setStatusMessage('WebSocket connection error. Is the backend running?');
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    } catch (err) {
      setIsProcessing(false);
      setStatusMessage(`Error: ${err.message}`);
    }
  }, [selectedVideo]);

  const renderContent = () => {
    if (activeTab === 'history') {
      return (
        <div className="h-full p-8">
          <HistoryPanel />
        </div>
      );
    }

    if (activeTab === 'results' && detectionData) {
      return (
        <div className="h-full flex flex-col gap-5 p-8 overflow-y-auto">
          {/* Filter toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Detection Results</h2>
            <div className="flex items-center gap-2">
              <button
                id="filter-all-btn"
                onClick={() => setFilterMode('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterMode === 'all' ? 'bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-hover)] border border-[var(--color-accent-primary)]/30' : 'text-[var(--color-text-muted)] hover:bg-white/5'}`}
              >
                <Eye size={12} />
                Full Video
              </button>
              <button
                id="filter-violent-btn"
                onClick={() => setFilterMode('violent')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterMode === 'violent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-[var(--color-text-muted)] hover:bg-white/5'}`}
              >
                <EyeOff size={12} />
                Violent Only
              </button>
            </div>
          </div>
          <TimelineBar
            frameData={detectionData.frameResults}
            filterMode={filterMode}
            segments={detectionData.segments}
          />
          <AnalyticsCharts
            summary={detectionData.summary}
            frameResults={detectionData.frameResults}
          />
        </div>
      );
    }

    // Default: Upload view
    return (
      <div className="h-full flex flex-col gap-4 p-8">
        {/* Top section: Upload + Output side by side */}
        <div className="flex-1 grid grid-cols-2 gap-5 min-h-0 overflow-hidden">
          <div className="glass-card rounded-2xl p-5 flex flex-col overflow-hidden">
            <VideoUpload selectedVideo={selectedVideo} onVideoSelect={setSelectedVideo} />
          </div>
          <div className={`glass-card rounded-2xl p-5 flex flex-col overflow-hidden transition-all duration-500 ${result && !isProcessing ? (result.label === 'Violent' ? 'glow-violent' : 'glow-safe') : ''}`}>
            <OutputPanel
              result={result}
              isProcessing={isProcessing}
              progress={progress}
              statusMessage={statusMessage}
              liveFrame={liveFrame}
              liveStats={liveStats}
            />
          </div>
        </div>

        {/* Run Detection button */}
        <div className="flex-shrink-0 flex items-center justify-center gap-4 py-4">
          <button
            id="run-detection-btn"
            onClick={handleRunDetection}
            disabled={!selectedVideo || isProcessing}
            className={`flex items-center gap-2.5 px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              selectedVideo && !isProcessing
                ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-[var(--color-dark-600)] text-[var(--color-text-muted)] cursor-not-allowed'
            }`}
          >
            <Play size={16} className={isProcessing ? 'animate-spin-slow' : ''} />
            {isProcessing ? 'Processing...' : 'Run Detection'}
          </button>

          {result && !isProcessing && (
            <button
              id="view-results-btn"
              onClick={() => setActiveTab('results')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm bg-white/5 border border-white/10 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-white transition-all"
            >
              <SlidersHorizontal size={14} />
              View Full Results
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="flex-1 min-w-0 overflow-hidden bg-gradient-to-br from-[var(--color-dark-900)] via-[var(--color-dark-800)] to-[var(--color-dark-900)] p-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

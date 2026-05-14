/**
 * Dummy data for the Violence Detection System UI
 * Used for testing and demonstration purposes
 */

// Simulated frame-by-frame analysis results
export const frameAnalysis = [
  { frame: 0, time: '0:00', violence: false, confidence: 0.12 },
  { frame: 30, time: '0:01', violence: false, confidence: 0.08 },
  { frame: 60, time: '0:02', violence: false, confidence: 0.15 },
  { frame: 90, time: '0:03', violence: false, confidence: 0.11 },
  { frame: 120, time: '0:04', violence: true, confidence: 0.72 },
  { frame: 150, time: '0:05', violence: true, confidence: 0.89 },
  { frame: 180, time: '0:06', violence: true, confidence: 0.94 },
  { frame: 210, time: '0:07', violence: true, confidence: 0.87 },
  { frame: 240, time: '0:08', violence: true, confidence: 0.91 },
  { frame: 270, time: '0:09', violence: false, confidence: 0.35 },
  { frame: 300, time: '0:10', violence: false, confidence: 0.18 },
  { frame: 330, time: '0:11', violence: false, confidence: 0.09 },
  { frame: 360, time: '0:12', violence: false, confidence: 0.14 },
  { frame: 390, time: '0:13', violence: true, confidence: 0.78 },
  { frame: 420, time: '0:14', violence: true, confidence: 0.85 },
  { frame: 450, time: '0:15', violence: true, confidence: 0.92 },
  { frame: 480, time: '0:16', violence: false, confidence: 0.22 },
  { frame: 510, time: '0:17', violence: false, confidence: 0.10 },
  { frame: 540, time: '0:18', violence: false, confidence: 0.06 },
  { frame: 570, time: '0:19', violence: false, confidence: 0.13 },
  { frame: 600, time: '0:20', violence: false, confidence: 0.08 },
];

// Summary statistics
export const analysisSummary = {
  totalFrames: 600,
  violentFrames: 240,
  nonViolentFrames: 360,
  violentPercentage: 40,
  nonViolentPercentage: 60,
  averageConfidence: 0.87,
  peakConfidence: 0.94,
  duration: '0:20',
  fps: 30,
};

// Pie chart data for violent vs non-violent distribution
export const distributionData = [
  { name: 'Violent', value: 40, color: '#ef4444' },
  { name: 'Non-Violent', value: 60, color: '#22c55e' },
];

// Confidence over time for line chart
export const confidenceTimeline = frameAnalysis.map((f) => ({
  time: f.time,
  confidence: Math.round(f.confidence * 100),
  isViolent: f.violence,
}));

// Detected violence segments (for the timeline bar)
export const violenceSegments = [
  { start: 4, end: 8, startTime: '0:04', endTime: '0:08', confidence: 0.87 },
  { start: 13, end: 15, startTime: '0:13', endTime: '0:15', confidence: 0.85 },
];

// History items
export const historyItems = [
  {
    id: 1,
    filename: 'street_cam_01.mp4',
    date: '2026-05-01 14:32',
    result: 'Violent',
    confidence: 87,
    duration: '0:20',
  },
  {
    id: 2,
    filename: 'parking_lot.mp4',
    date: '2026-04-30 09:15',
    result: 'Non-Violent',
    confidence: 95,
    duration: '1:05',
  },
  {
    id: 3,
    filename: 'subway_footage.mp4',
    date: '2026-04-29 18:44',
    result: 'Violent',
    confidence: 92,
    duration: '0:45',
  },
  {
    id: 4,
    filename: 'campus_walk.mp4',
    date: '2026-04-28 11:22',
    result: 'Non-Violent',
    confidence: 98,
    duration: '2:10',
  },
  {
    id: 5,
    filename: 'night_market.mp4',
    date: '2026-04-27 21:08',
    result: 'Violent',
    confidence: 79,
    duration: '0:33',
  },
];

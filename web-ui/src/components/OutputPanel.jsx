import { Monitor, AlertTriangle, CheckCircle, Bell } from 'lucide-react';

export default function OutputPanel({ result, isProcessing, progress, statusMessage, liveFrame, liveStats }) {
  // ─── Processing state with real-time feed ───
  if (isProcessing) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={18} className="text-[var(--color-accent-primary)]" />
          <h2 className="text-base font-semibold text-white">Live Detection</h2>
        </div>

        <div className="flex-1 rounded-2xl bg-[var(--color-dark-700)]/40 border border-white/[0.06] flex flex-col overflow-hidden">
          {/* Live thumbnail */}
          {liveFrame ? (
            <div className="flex-1 relative min-h-0">
              <img
                src={liveFrame}
                alt="Live frame"
                className="w-full h-full object-contain"
              />
              {/* Live badge overlay */}
              {liveStats && (
                <div className="absolute top-3 left-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${
                    liveStats.violence
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {liveStats.violence ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                    {liveStats.violence ? 'Violent' : 'Safe'}
                    <span className="ml-1 opacity-70">
                      {Math.round(liveStats.confidence * 100)}%
                    </span>
                  </div>
                </div>
              )}
              {/* Live indicator */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600/80 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold text-white">LIVE</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--color-dark-500)] border-t-[var(--color-accent-primary)] animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-accent-primary)]/20 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Bottom stats bar */}
          <div className="flex-shrink-0 p-3 border-t border-white/[0.06] space-y-2">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-[var(--color-dark-500)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 transition-all duration-300"
                  style={{ width: `${progress || 0}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[var(--color-accent-hover)] min-w-[3rem] text-right">
                {Math.round(progress || 0)}%
              </span>
            </div>

            {/* Status text */}
            <p className="text-[11px] text-[var(--color-text-muted)] truncate">
              {statusMessage || 'Initializing...'}
            </p>

            {/* Live stats row */}
            {liveStats && (
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-[var(--color-text-muted)]">
                  Frame <span className="text-white font-medium">{liveStats.frame}</span>/{liveStats.totalFrames}
                </span>
                <span className="text-[var(--color-text-muted)]">•</span>
                <span className="text-[var(--color-text-muted)]">
                  Violence: <span className="text-red-400 font-medium">{liveStats.violentCount}</span>
                </span>
                <span className="text-[var(--color-text-muted)]">•</span>
                <span className="text-[var(--color-text-muted)]">
                  Time: <span className="text-white font-medium">{liveStats.time}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── No result yet ───
  if (!result) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={18} className="text-[var(--color-accent-primary)]" />
          <h2 className="text-base font-semibold text-white">Output</h2>
        </div>
        <div className="flex-1 rounded-2xl bg-[var(--color-dark-700)]/40 border border-white/[0.06] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-dark-600)] flex items-center justify-center">
            <Monitor size={28} className="text-[var(--color-text-muted)]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              No output yet
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Upload a video and run detection
            </p>
          </div>
          {statusMessage && (
            <p className="text-xs text-yellow-400/80 px-4 text-center">{statusMessage}</p>
          )}
        </div>
      </div>
    );
  }

  // ─── Result display ───
  const isViolent = result.label === 'Violent';

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4">
        <Monitor size={18} className="text-[var(--color-accent-primary)]" />
        <h2 className="text-base font-semibold text-white">Detection Result</h2>
      </div>

      {/* Processed video player or last thumbnail */}
      <div className="flex-1 rounded-2xl overflow-hidden bg-black/40 border border-white/[0.06] relative mb-3">
        {liveFrame ? (
          <img src={liveFrame} alt="Detection result" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-dark-700)] to-[var(--color-dark-900)]">
            <div className="text-center">
              <Monitor size={48} className="text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-xs text-[var(--color-text-muted)]">Detection complete</p>
            </div>
          </div>
        )}
        {/* Detection badge overlay */}
        <div className="absolute top-3 left-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${
              isViolent
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10'
                : 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10'
            }`}
          >
            {isViolent ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
            {result.label}
          </div>
        </div>
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`p-3 rounded-xl border ${
            isViolent
              ? 'bg-red-500/[0.08] border-red-500/20'
              : 'bg-green-500/[0.08] border-green-500/20'
          }`}
        >
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium mb-1">
            Detection
          </p>
          <div className="flex items-center gap-2">
            {isViolent ? (
              <AlertTriangle size={16} className="text-red-400" />
            ) : (
              <CheckCircle size={16} className="text-green-400" />
            )}
            <span className={`text-sm font-bold ${isViolent ? 'text-red-400' : 'text-green-400'}`}>
              {result.label}
            </span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--color-dark-700)]/60 border border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium mb-1">
            Confidence
          </p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-white">{result.confidence}</span>
            <span className="text-sm text-[var(--color-text-muted)] mb-1">%</span>
          </div>
        </div>
      </div>

      {/* Telegram alert badge */}
      {result.alertSent && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-yellow-500/[0.08] border border-yellow-500/20 animate-fade-in-up">
          <Bell size={14} className="text-yellow-400" />
          <span className="text-xs font-medium text-yellow-400">Telegram Alert Sent</span>
        </div>
      )}
    </div>
  );
}

export default function TimelineBar({ frameData, filterMode, segments }) {
  if (!frameData || frameData.length === 0) return null;

  // Downsample for display if too many frames (show max ~80 bars)
  const maxBars = 80;
  let displayData = frameData;
  if (frameData.length > maxBars) {
    const step = Math.ceil(frameData.length / maxBars);
    displayData = frameData.filter((_, i) => i % step === 0);
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Detection Timeline</h3>
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span className="text-[var(--color-text-muted)]">Violent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
            <span className="text-[var(--color-text-muted)]">Non-Violent</span>
          </div>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="relative">
        <div className="flex gap-[2px] h-10 rounded-lg overflow-hidden">
          {displayData.map((frame, idx) => {
            const isViolent = frame.violence;
            const shouldDim = filterMode === 'violent' && !isViolent;
            return (
              <div
                key={idx}
                className="flex-1 relative group cursor-pointer transition-all duration-200"
                style={{ opacity: shouldDim ? 0.15 : 1 }}
              >
                <div
                  className={`w-full h-full transition-all duration-200 group-hover:scale-y-110 origin-bottom ${
                    isViolent
                      ? 'bg-gradient-to-t from-red-600 to-red-400'
                      : 'bg-gradient-to-t from-green-600/60 to-green-400/40'
                  }`}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-[var(--color-dark-700)] border border-white/10 rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
                    <p className="text-[10px] font-medium text-white">{frame.time}</p>
                    <p className={`text-[10px] ${isViolent ? 'text-red-400' : 'text-green-400'}`}>
                      {isViolent ? 'Violent' : 'Safe'} — {Math.round(frame.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {frameData[0]?.time || '0:00'}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {frameData[frameData.length - 1]?.time || '—'}
          </span>
        </div>
      </div>

      {/* Violence segments list */}
      {segments && segments.length > 0 && (
        <div className="mt-4 space-y-2">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/[0.06] border border-red-500/10"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-red-500" />
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {seg.startTime} — {seg.endTime}
                </span>
              </div>
              <span className="text-xs font-medium text-red-400">
                {Math.round(seg.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

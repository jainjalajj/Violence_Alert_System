import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, CheckCircle, FileVideo, Trash2, RefreshCw, Inbox, Bell } from 'lucide-react';

export default function HistoryPanel() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all detection history?')) return;
    try {
      await fetch('/api/history', { method: 'DELETE' });
      setHistory([]);
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <RefreshCw size={24} className="text-[var(--color-accent-primary)] animate-spin-slow" />
        <p className="text-sm text-[var(--color-text-muted)]">Loading history...</p>
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <AlertTriangle size={24} className="text-red-400" />
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchHistory}
          className="text-xs text-[var(--color-accent-hover)] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-[var(--color-accent-primary)]" />
          <h2 className="text-lg font-semibold text-white">Detection History</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="refresh-history-btn"
            onClick={fetchHistory}
            title="Refresh"
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-[var(--color-text-muted)] hover:text-white"
          >
            <RefreshCw size={14} />
          </button>
          {history.length > 0 && (
            <>
              <span className="text-xs text-[var(--color-text-muted)] px-2.5 py-1 rounded-full bg-[var(--color-dark-600)]">
                {history.length} {history.length === 1 ? 'record' : 'records'}
              </span>
              <button
                id="clear-history-btn"
                onClick={handleClearAll}
                title="Clear all history"
                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-[var(--color-text-muted)] hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Empty state ─── */}
      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-dark-600)] flex items-center justify-center">
            <Inbox size={28} className="text-[var(--color-text-muted)]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">No detections yet</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Upload a video and run detection to see results here
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.map((item, idx) => {
            const isViolent = item.result === 'Violent';
            return (
              <div
                key={item.id}
                className="glass-card rounded-xl p-4 hover:bg-white/[0.04] transition-all duration-200 group animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isViolent ? 'bg-red-500/15' : 'bg-green-500/15'
                    }`}
                  >
                    <FileVideo size={18} className={isViolent ? 'text-red-400' : 'text-green-400'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate group-hover:text-[var(--color-accent-hover)] transition-colors">
                        {item.filename}
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isViolent
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-green-500/15 text-green-400'
                          }`}
                        >
                          {isViolent ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                          {item.result}
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 transition-all text-[var(--color-text-muted)] hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-[var(--color-text-muted)]">{item.date}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">•</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{item.duration}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">•</span>
                      <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">
                        {item.confidence}% conf
                      </span>
                      {item.violentPercentage !== undefined && (
                        <>
                          <span className="text-[10px] text-[var(--color-text-muted)]">•</span>
                          <span className="text-[10px] text-red-400/70 font-medium">
                            {item.violentPercentage}% violent
                          </span>
                        </>
                      )}
                      {item.alertSent && (
                        <>
                          <span className="text-[10px] text-[var(--color-text-muted)]">•</span>
                          <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-medium">
                            <Bell size={10} />
                            Alert Sent
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

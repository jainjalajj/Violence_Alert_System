import { Shield, Activity, Bell } from 'lucide-react';

export default function Navbar() {
  return (
    <nav
      id="main-navbar"
      className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[var(--color-dark-800)]/80 backdrop-blur-xl z-50 relative"
    >
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield size={20} className="text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[var(--color-dark-800)] animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Violence Detection System
          </h1>
          <p className="text-[10px] text-[var(--color-text-muted)] font-medium tracking-widest uppercase">
            AI-Powered Analysis
          </p>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <Activity size={14} className="text-green-400" />
          <span className="text-xs font-medium text-green-400">Model Active</span>
        </div>

        <button
          id="notifications-btn"
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Bell size={18} className="text-[var(--color-text-secondary)]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer">
          V
        </div>
      </div>
    </nav>
  );
}

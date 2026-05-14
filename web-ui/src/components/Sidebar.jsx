import { Upload, BarChart3, Clock, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const navItems = [
  { id: 'upload', label: 'Upload Video', icon: Upload },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse }) {
  return (
    <aside
      id="main-sidebar"
      className={`${
        collapsed ? 'w-[72px]' : 'w-60'
      } h-full bg-[var(--color-dark-800)]/60 border-r border-white/[0.06] flex flex-col transition-all duration-300 ease-in-out relative`}
    >
      {/* Collapse Toggle */}
      <button
        id="sidebar-toggle"
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-[var(--color-dark-600)] border border-white/10 flex items-center justify-center hover:bg-[var(--color-accent-primary)] transition-colors group"
      >
        {collapsed ? (
          <ChevronRight size={12} className="text-[var(--color-text-secondary)] group-hover:text-white" />
        ) : (
          <ChevronLeft size={12} className="text-[var(--color-text-secondary)] group-hover:text-white" />
        )}
      </button>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-hover)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-white/[0.04] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[var(--color-accent-primary)]" />
              )}
              <Icon
                size={20}
                className={`flex-shrink-0 transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`}
              />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom info */}
      {!collapsed && (
        <div className="p-4 mx-3 mb-4 rounded-xl bg-gradient-to-br from-[var(--color-accent-primary)]/10 to-purple-600/10 border border-[var(--color-accent-primary)]/20">
          <p className="text-xs font-semibold text-[var(--color-accent-hover)]">Model Info</p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1">MobileNetV2</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">Accuracy: 94.2%</p>
        </div>
      )}
    </aside>
  );
}

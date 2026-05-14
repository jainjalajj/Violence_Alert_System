import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { TrendingUp, Target, Zap, Clock } from 'lucide-react';

const COLORS = ['#ef4444', '#22c55e'];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--color-dark-700)]/50 border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-dark-700)] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-[var(--color-text-muted)]">{label}</p>
      <p className="text-sm font-bold text-white">{payload[0].value}%</p>
    </div>
  );
};

export default function AnalyticsCharts({ summary, frameResults }) {
  // Build chart data from real results
  const distributionData = useMemo(() => [
    { name: 'Violent', value: summary?.violentPercentage || 0, color: '#ef4444' },
    { name: 'Non-Violent', value: summary?.nonViolentPercentage || 0, color: '#22c55e' },
  ], [summary]);

  const confidenceTimeline = useMemo(() => {
    if (!frameResults || frameResults.length === 0) return [];
    // Downsample to max ~50 points for the chart
    const maxPoints = 50;
    const step = Math.max(1, Math.ceil(frameResults.length / maxPoints));
    return frameResults
      .filter((_, i) => i % step === 0)
      .map((f) => ({
        time: f.time,
        confidence: Math.round(f.confidence * 100),
        isViolent: f.violence,
      }));
  }, [frameResults]);

  if (!summary) return null;

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Analytics</h3>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={Target}
          label="Peak Conf."
          value={`${Math.round((summary.peakConfidence || 0) * 100)}%`}
          sub="Max detection"
          color="text-[var(--color-accent-primary)]"
        />
        <StatCard
          icon={TrendingUp}
          label="Violent"
          value={`${summary.violentPercentage}%`}
          sub={`${summary.violentFrames} frames`}
          color="text-red-400"
        />
        <StatCard
          icon={Zap}
          label="Avg Conf."
          value={`${Math.round((summary.averageConfidence || 0) * 100)}%`}
          sub="Violent frames"
          color="text-yellow-400"
        />
        <StatCard
          icon={Clock}
          label="Duration"
          value={summary.duration || '—'}
          sub={`${summary.fps || 30} FPS`}
          color="text-green-400"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Pie chart */}
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">Distribution</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {distributionData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-1">
            {distributionData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-[10px] text-[var(--color-text-muted)]">{d.name}: {d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Area chart */}
        <div className="col-span-2">
          <p className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">Confidence Over Time</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={confidenceTimeline}>
                <defs>
                  <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="confidence" stroke="#6366f1" strokeWidth={2} fill="url(#confGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

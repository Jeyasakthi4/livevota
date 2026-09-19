import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Clock,
  Users,
  Zap,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { PollAnalytics } from '../types';
import { api } from '../services/api';

interface CreatorAnalyticsModalProps {
  pollId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorAnalyticsModal: React.FC<CreatorAnalyticsModalProps> = ({
  pollId,
  isOpen,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<PollAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadAnalytics();
  }, [isOpen, pollId]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPollAnalytics(pollId);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load telemetry.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/[0.08] bg-[#0A0D14] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4 bg-white/[0.01]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold block">
              TELEMETRY & AUDIT
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">How the Room Moved</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAnalytics}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Refresh Telemetry"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-zinc-300">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-zinc-400 font-mono text-xs">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <span>Querying Redis telemetry stream...</span>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-xs text-red-300">
              <p>{error}</p>
              <button
                onClick={loadAnalytics}
                className="mt-2 rounded bg-white/10 px-3 py-1 text-white hover:bg-white/20"
              >
                Retry
              </button>
            </div>
          ) : analytics ? (
            <>
              {/* Top 4 Compact Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                    <Users className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Total Pulses</span>
                  </div>
                  <span className="font-mono text-2xl font-bold text-white">
                    {analytics.total_votes}
                  </span>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    <span>Current Rate</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-bold text-amber-300">
                      +{analytics.votes_per_minute}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">/min</span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                    <Zap className="h-3.5 w-3.5 text-violet-400" />
                    <span>Peak Velocity</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-bold text-violet-300">
                      {analytics.peak_votes_per_minute}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">max/min</span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Duration</span>
                  </div>
                  <span className="font-mono text-2xl font-bold text-white">
                    {formatDuration(analytics.poll_duration_seconds)}
                  </span>
                </div>
              </div>

              {/* Clean "How the Room Moved" Timeline Chart */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Vote Trajectory (Cumulative Timeline)
                  </span>
                  <span className="font-mono text-[11px] text-cyan-400">Live Intervals</span>
                </div>

                {/* SVG Mini Area Curve */}
                <div className="h-28 w-full pt-2">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="curveGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const buckets = analytics.votes_over_time || [];
                      if (buckets.length === 0) return null;
                      const maxVal = Math.max(...buckets.map((b) => b.cumulative), 1);
                      const points = buckets.map((b, i) => {
                        const x = (i / Math.max(buckets.length - 1, 1)) * 500;
                        const y = 90 - (b.cumulative / maxVal) * 75;
                        return `${x},${y}`;
                      });
                      const pathD = `M 0,90 L ${points.join(' L ')} L 500,90 Z`;
                      const lineD = `M ${points.join(' L ')}`;

                      return (
                        <>
                          <path d={pathD} fill="url(#curveGlow)" />
                          <path d={lineD} fill="none" stroke="#06B6D4" strokeWidth="2" />
                          {buckets.map((b, i) => {
                            const x = (i / Math.max(buckets.length - 1, 1)) * 500;
                            const y = 90 - (b.cumulative / maxVal) * 75;
                            return (
                              <circle key={i} cx={x} cy={y} r="3" fill="#22D3EE" stroke="#0A0D14" strokeWidth="1.5" />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Time Axis Markers */}
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/[0.04]">
                  {analytics.votes_over_time.map((b, i) => (
                    <span key={i}>{b.time}</span>
                  ))}
                </div>
              </div>

              {/* Option Distribution Breakdown */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Option Share Breakdown
                  </span>
                  <span className="font-mono text-zinc-400">{analytics.total_votes} Total Pulses</span>
                </div>

                <div className="space-y-2.5">
                  {analytics.options_distribution.map((opt) => (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-200 truncate font-medium">{opt.text}</span>
                        <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                          <span className="text-white font-bold">{opt.percentage.toFixed(1)}%</span>
                          <span className="text-zinc-400 text-[11px]">({opt.votes})</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                          style={{ width: `${opt.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Audience Reactions Telemetry */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block mb-3">
                  Anonymous Impulse Reactions
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {['🔥', '❤️', '👀', '🤔', '💡'].map((emoji) => {
                    const count = analytics.reactions[emoji] || 0;
                    return (
                      <div
                        key={emoji}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5"
                      >
                        <span className="text-base">{emoji}</span>
                        <span className="font-mono text-xs font-bold text-white">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

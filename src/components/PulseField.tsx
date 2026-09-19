import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Zap,
  GraduationCap,
  Briefcase,
  Timer,
  Lightbulb,
  PartyPopper,
  BarChart2,
  Globe,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Option } from '../types';
import { PulseTheme, THEME_DEFAULT_ECLIPSE } from '../utils/themeManager';

interface PulseFieldProps {
  options: Option[];
  totalVotes: number;
  pulsingOptionId?: string | null;
  selectedOptionId?: string | null;
  onSelectOption?: (optionId: string) => void;
  interactive?: boolean;
  reducedMotion?: boolean;
  accentMode?: 'cyan' | 'violet' | 'dynamic';
  theme?: PulseTheme;
}

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const THEME_ICONS: Record<string, React.ElementType> = {
  GraduationCap,
  Briefcase,
  Zap,
  Timer,
  Trophy,
  Lightbulb,
  PartyPopper,
  BarChart2,
  Globe,
  Flame,
  CheckCircle2,
};

export const PulseField: React.FC<PulseFieldProps> = ({
  options,
  totalVotes,
  pulsingOptionId,
  selectedOptionId,
  onSelectOption,
  interactive = false,
  reducedMotion = false,
  theme = THEME_DEFAULT_ECLIPSE,
}) => {
  const maxVotes = useMemo(() => {
    return Math.max(...options.map((o) => o.votes), 0);
  }, [options]);

  // Sort options by vote for competition mode to show live ranking
  const sortedOptionIndices = useMemo(() => {
    const indicesWithVotes = options.map((opt, i) => ({ index: i, votes: opt.votes }));
    indicesWithVotes.sort((a, b) => b.votes - a.votes);
    const ranks: Record<number, number> = {};
    indicesWithVotes.forEach((item, rank) => {
      ranks[item.index] = rank + 1;
    });
    return ranks;
  }, [options]);

  const NodeIcon = THEME_ICONS[theme.visualDetails?.primaryIcon] || Zap;

  return (
    <div
      style={theme.cssVariables as React.CSSProperties}
      className={`relative w-full overflow-hidden ${theme.surface?.cardRounded || 'rounded-2xl'} border ${theme.tailwindClasses.containerBorder} ${theme.tailwindClasses.gridBg} ${theme.tailwindClasses.containerGlow} p-5 sm:p-8 transition-all duration-500`}
    >
      {/* Ambient background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1e2230_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />

      {/* Top subtle harmonic line connecting the nodes */}
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ backgroundColor: theme.leadPalette.text }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: theme.leadPalette.text }}
            />
          </span>
          <span
            className="font-bold truncate px-2 py-0.5 rounded text-[10px] tracking-wider"
            style={{
              backgroundColor: theme.accentColors?.badgeBg || 'rgba(255,255,255,0.05)',
              color: theme.accentColors?.badgeText || theme.leadPalette.text,
              border: `1px solid ${theme.accentColors?.badgeBorder || 'transparent'}`,
            }}
          >
            {theme.visualDetails?.personalityBadge || theme.name}
          </span>
          <span className="hidden sm:inline text-zinc-600">·</span>
          <span className="hidden sm:inline text-zinc-400 text-[10px] normal-case tracking-normal truncate">
            {theme.tagline}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {theme.visualDetails?.specialWidget === 'countdown' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              <Timer className="h-3 w-3" />
              <span>{theme.visualDetails.widgetText}</span>
            </span>
          )}

          {theme.visualDetails?.specialWidget === 'leaderboard' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
              <Trophy className="h-3 w-3 text-amber-400" />
              <span>{theme.visualDetails.widgetText}</span>
            </span>
          )}

          {theme.visualDetails?.specialWidget === 'metrics' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
              <BarChart2 className="h-3 w-3" />
              <span>{theme.visualDetails.widgetText}</span>
            </span>
          )}

          <span className="text-zinc-400 font-mono">
            {totalVotes} {totalVotes === 1 ? 'Pulse' : 'Pulses'}
          </span>
        </div>
      </div>

      {/* Dynamic Node Field Grid */}
      <div className="relative z-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-2">
        {options.map((opt, index) => {
          const isLeading = maxVotes > 0 && opt.votes === maxVotes;
          const isPulsing = pulsingOptionId === opt.id;
          const isSelected = selectedOptionId === opt.id;
          const letter = OPTION_KEYS[index] || String(index + 1);
          const palette = theme.palette[index % theme.palette.length];
          const rank = sortedOptionIndices[index] || index + 1;

          // Dynamic scale: range between 1.0 (0%) and theme.pulseScalePeak for organic visual breathing
          const dynamicScale = reducedMotion ? 1 : 1 + (opt.percentage / 100) * (theme.animation.pulseScalePeak - 1);
          // Core node size indicator: respects theme.nodeBaseSize and theme.nodeGrowthFactor
          const nodeCoreDiameter = theme.nodeBaseSize + Math.round((opt.percentage / 100) * theme.nodeGrowthFactor);

          return (
            <motion.div
              key={opt.id}
              layout={!reducedMotion}
              initial={false}
              animate={{
                scale: isPulsing && !reducedMotion ? [dynamicScale, dynamicScale + 0.04, dynamicScale] : dynamicScale,
              }}
              transition={{ duration: theme.animation.pulseFrequencySeconds, ease: 'easeOut' }}
              onClick={() => interactive && onSelectOption?.(opt.id)}
              className={`group relative flex flex-col justify-between ${theme.surface?.cardRounded || 'rounded-xl'} border p-4 sm:p-5 transition-all duration-300 ${
                interactive ? 'cursor-pointer select-none active:scale-[0.99]' : ''
              } ${
                isSelected
                  ? theme.surface?.cardSelected || theme.tailwindClasses.cardSelected
                  : isLeading && totalVotes > 0
                  ? theme.surface?.cardLeading || theme.tailwindClasses.cardLeading
                  : `${theme.surface?.cardBorder || theme.tailwindClasses.cardBorder} ${theme.surface?.cardBg || theme.tailwindClasses.cardBg} hover:border-white/[0.2]`
              }`}
            >
              {/* Subtle radial pulse aura when vote arrives */}
              {isPulsing && !reducedMotion && (
                <motion.div
                  initial={{ opacity: 0.85, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.25 }}
                  transition={{ duration: theme.animation.pulseFrequencySeconds, ease: 'easeOut' }}
                  style={{
                    backgroundColor: palette.glow,
                    boxShadow: `0 0 25px ${palette.glow}`,
                  }}
                  className={`pointer-events-none absolute inset-0 ${theme.surface?.cardRounded || 'rounded-xl'} ring-2`}
                />
              )}

              {/* Node Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Letter or Rank Tag */}
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-white text-black font-bold'
                        : isLeading && totalVotes > 0
                        ? 'border font-bold'
                        : 'bg-white/[0.05] text-zinc-400 border border-white/[0.06]'
                    }`}
                    style={
                      isLeading && totalVotes > 0 && !isSelected
                        ? {
                            backgroundColor: theme.leadPalette.badgeBg,
                            color: theme.leadPalette.text,
                            borderColor: theme.leadPalette.badgeBorder,
                          }
                        : {}
                    }
                  >
                    {theme.personality === 'competition' ? `#${rank}` : letter}
                  </div>

                  {/* Option Title */}
                  <h4 className={`${theme.typography?.labelClass || 'font-sans text-sm font-semibold text-zinc-100'} leading-snug truncate`}>
                    {opt.text}
                  </h4>
                </div>

                {/* Leading / Podium Badge */}
                {isLeading && totalVotes > 0 && (
                  <div
                    className="shrink-0 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium"
                    style={{
                      backgroundColor: theme.leadPalette.badgeBg,
                      borderColor: theme.leadPalette.badgeBorder,
                      color: theme.leadPalette.text,
                    }}
                  >
                    <Trophy className="h-3 w-3" style={{ color: theme.leadPalette.text }} />
                    <span>{theme.personality === 'competition' ? 'PODIUM #1' : 'LEAD'}</span>
                  </div>
                )}
              </div>

              {/* Central Node Footprint & Dynamic Metric */}
              <div className="my-4 flex items-center justify-between gap-4">
                {/* Node Orb: Dynamic size represents vote percentage */}
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    {/* Concentric aura ring */}
                    <motion.div
                      animate={
                        isPulsing && !reducedMotion
                          ? { scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }
                          : { scale: 1, opacity: 0.5 }
                      }
                      transition={{ duration: theme.animation.pulseFrequencySeconds }}
                      style={{
                        width: nodeCoreDiameter + 12,
                        height: nodeCoreDiameter + 12,
                        borderColor: palette.border,
                        backgroundColor: palette.bg,
                      }}
                      className="rounded-full border border-dashed transition-all duration-500"
                    />

                    {/* Glowing Core Node with Personality Icon */}
                    <div
                      style={{
                        width: nodeCoreDiameter,
                        height: nodeCoreDiameter,
                        backgroundColor: palette.glow,
                        borderColor: palette.border,
                      }}
                      className="absolute flex items-center justify-center rounded-full border backdrop-blur-xs transition-all duration-500 shadow-inner"
                    >
                      <NodeIcon
                        className="h-3.5 w-3.5 transition-transform group-hover:scale-110"
                        style={{ color: palette.text }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-zinc-400">
                      {opt.votes} {opt.votes === 1 ? 'pulse' : 'pulses'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {totalVotes > 0 ? `${((opt.votes / totalVotes) * 100).toFixed(0)}% share` : 'awaiting votes'}
                    </span>
                  </div>
                </div>

                {/* Percentage readout */}
                <div className="text-right">
                  <motion.span
                    key={opt.percentage.toFixed(1)}
                    initial={{ opacity: 0.7, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${theme.typography?.metricClass || 'font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white'}`}
                  >
                    {opt.percentage.toFixed(1)}%
                  </motion.span>
                </div>
              </div>

              {/* Minimal Linear Trace / Streamline */}
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${opt.percentage}%`,
                    backgroundColor: palette.barColor,
                    boxShadow: `0 0 10px ${palette.glow}`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

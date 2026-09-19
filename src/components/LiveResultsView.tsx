import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Lock,
  Unlock,
  Radio,
  Download,
  Database,
  Tv,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  QrCode,
  BarChart3,
  ChevronDown,
  RotateCcw,
  Share2,
  Palette,
  Check,
} from 'lucide-react';
import { Poll, VoteEvent, User, ActivityEvent } from '../types';
import { api, connectPollWebSocket } from '../services/api';
import { PulseField } from './PulseField';
import { LiveReactionsOverlay } from './LiveReactionsOverlay';
import { PresentationModeView } from './PresentationModeView';
import { CreatorAnalyticsModal } from './CreatorAnalyticsModal';
import { sounds } from '../utils/soundEffects';
import { PulseTheme, ALL_THEMES, getThemeForPoll } from '../utils/themeManager';
import { ThemedEventBackground } from './ThemedEventBackground';

interface LiveResultsViewProps {
  initialPoll: Poll;
  currentUser: User | null;
  onOpenVote: (pollId: string) => void;
  onShare: () => void;
  onOpenRedisInspector: () => void;
}

export const LiveResultsView: React.FC<LiveResultsViewProps> = ({
  initialPoll,
  currentUser,
  onOpenVote,
  onShare,
  onOpenRedisInspector,
}) => {
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [pulsingOptionId, setPulsingOptionId] = useState<string | null>(null);
  const [velocity, setVelocity] = useState<number>(0);
  const [velocityTrend, setVelocityTrend] = useState<'increasing' | 'steady' | 'decreasing'>('steady');
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>(initialPoll.reactions || {});
  const [incomingReaction, setIncomingReaction] = useState<{ emoji: string; id: string } | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Dynamic Theme resolution based on template_id or poll metadata
  const initialTheme = useMemo(() => getThemeForPoll(initialPoll), [initialPoll]);
  const [activeThemeId, setActiveThemeId] = useState<string>(initialTheme.id);
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    setPoll(initialPoll);
    if (initialPoll.reactions) {
      setReactions(initialPoll.reactions);
    }
    const resolved = getThemeForPoll(initialPoll);
    setActiveThemeId(resolved.id);
  }, [initialPoll]);

  const currentTheme: PulseTheme = useMemo(() => {
    return ALL_THEMES.find((t) => t.id === activeThemeId) || initialTheme;
  }, [activeThemeId, initialTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setReducedMotion(true);
    }
  }, []);

  // WebSocket Live Updates
  useEffect(() => {
    const disconnect = connectPollWebSocket(
      poll.id,
      (event: VoteEvent) => {
        if (event.type === 'vote' || event.type === 'init') {
          if (event.option_id) {
            setPulsingOptionId(event.option_id);
            sounds.playVoteSuccess();
            setTimeout(() => setPulsingOptionId(null), 850);
          }

          if (event.votes_per_minute !== undefined) {
            setVelocity(event.votes_per_minute);
          }
          if (event.velocity_trend) {
            setVelocityTrend(event.velocity_trend);
          }

          if (event.activity_event) {
            setActivityFeed((prev) => [event.activity_event!, ...prev.slice(0, 6)]);
          } else if (event.type === 'vote') {
            const votedOpt = poll.options.find((o) => o.id === event.option_id);
            const optName = votedOpt ? votedOpt.text : 'an option';
            setActivityFeed((prev) => [
              {
                id: Math.random().toString(),
                text: `Pulse recorded for "${optName}"`,
                time: 'Just now',
                type: 'vote',
                option_id: event.option_id,
              },
              ...prev.slice(0, 6),
            ]);
          }

          setPoll((prev) => {
            const newTotal = event.total_votes;
            const updatedOptions = prev.options.map((opt) => {
              const optCount = event.option_votes
                ? event.option_votes[opt.id] ?? opt.votes
                : event.option_id === opt.id
                ? opt.votes + 1
                : opt.votes;

              const percentage = newTotal > 0 ? (optCount / newTotal) * 100 : 0;
              return {
                ...opt,
                votes: optCount,
                percentage,
              };
            });

            return {
              ...prev,
              total_votes: newTotal,
              options: updatedOptions,
              is_closed: event.is_closed !== undefined ? event.is_closed : prev.is_closed,
            };
          });
        } else if (event.type === 'reaction') {
          if (event.emoji) {
            setIncomingReaction({ emoji: event.emoji, id: Math.random().toString() });
            sounds.playReactionBubble();
            setActivityFeed((prev) => [
              {
                id: Math.random().toString(),
                text: `Anonymous reaction ${event.emoji}`,
                time: 'Just now',
                type: 'reaction',
                emoji: event.emoji,
              },
              ...prev.slice(0, 6),
            ]);
          }
          if (event.reactions) {
            setReactions(event.reactions);
          }
        } else if (event.type === 'status') {
          if (event.is_closed !== undefined) {
            setPoll((prev) => ({ ...prev, is_closed: event.is_closed! }));
          }
        }
      },
      (connected) => setWsConnected(connected)
    );

    return () => {
      disconnect();
    };
  }, [poll.id]);

  const handleToggleClosePoll = async () => {
    setActionLoading(true);
    try {
      if (poll.is_closed) {
        await api.reopenPoll(poll.id);
        setPoll((prev) => ({ ...prev, is_closed: false }));
      } else {
        await api.closePoll(poll.id);
        setPoll((prev) => ({ ...prev, is_closed: true }));
      }
    } catch (e) {
      console.warn('Toggle close error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    sounds.playSelect();
    const rows = [
      ['Option ID', 'Option Text', 'Pulses', 'Percentage'],
      ...poll.options.map((o) => [o.id, `"${o.text.replace(/"/g, '""')}"`, o.votes, `${o.percentage.toFixed(2)}%`]),
      ['Total Pulses', '', poll.total_votes, '100%'],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csvContent);
    a.download = `livevota_${poll.code}_pulses.csv`;
    a.click();
    a.remove();
  };

  return (
    <div
      style={currentTheme.cssVariables as React.CSSProperties}
      className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 transition-colors duration-500"
    >
      {/* Impressive Architectural Event Background */}
      <ThemedEventBackground
        personality={currentTheme.personality}
        theme={currentTheme}
        variant="fullscreen"
        opacity={1}
      />
      {/* Floating Reactions Canvas */}
      <LiveReactionsOverlay
        pollId={poll.id}
        reactions={reactions}
        reducedMotion={reducedMotion}
        incomingReaction={incomingReaction}
        showBar={false}
        variant="floating"
      />

      {/* Top Quiet Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
        {/* Room & PubSub Badge & Dynamic Theme */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-bold tracking-widest text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-lg">
            ROOM · {poll.code}
          </span>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
                wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="hidden sm:inline">{wsConnected ? 'Pub/Sub Live' : 'Connecting'}</span>
          </div>

          {/* Dynamic Theme Indicator & Live Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 text-xs font-mono text-zinc-300 hover:border-cyan-500/40 hover:text-white transition cursor-pointer"
              title="Change or inspect the Pulse Field Theme mapped to this event template"
              id="room-theme-picker-btn"
            >
              <Palette className="h-3 w-3 text-cyan-400" />
              <div className="flex -space-x-1 items-center">
                {currentTheme.palette.slice(0, 3).map((p, idx) => (
                  <span
                    key={idx}
                    className="h-2 w-2 rounded-full border border-black"
                    style={{ backgroundColor: p.accent }}
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium hidden md:inline">{currentTheme.name}</span>
              <ChevronDown className="h-3 w-3 text-zinc-500 ml-0.5" />
            </button>

            {showThemePicker && (
              <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-white/[0.12] bg-[#0C0F17] p-2 shadow-2xl z-40 space-y-1 text-xs max-h-96 overflow-y-auto backdrop-blur-xl">
                <div className="px-3 py-2 border-b border-white/[0.06] mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                    <Palette className="h-3 w-3 text-cyan-400" />
                    <span>Template Themes</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">{ALL_THEMES.length} styles</span>
                </div>
                {ALL_THEMES.map((th) => {
                  const isSelected = th.id === currentTheme.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => {
                        setActiveThemeId(th.id);
                        setShowThemePicker(false);
                        sounds.playSelect();
                      }}
                      className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-white/[0.08] text-white border border-white/[0.1]'
                          : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex -space-x-1 shrink-0">
                          {th.palette.slice(0, 3).map((p, i) => (
                            <span
                              key={i}
                              className="h-3 w-3 rounded-full border border-black/80"
                              style={{ backgroundColor: p.accent }}
                            />
                          ))}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs truncate leading-tight text-zinc-200">
                            {th.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {th.tagline}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {poll.is_closed && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono text-amber-300">
              <Lock className="h-3 w-3" /> Closed
            </span>
          )}
        </div>

        {/* Primary Clear Action + Progressive Disclosure */}
        <div className="flex items-center gap-2">
          {/* Primary Action: Launch Presentation Mode */}
          <button
            onClick={() => {
              sounds.playSelect();
              setIsPresentationOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition active:scale-[0.98] cursor-pointer shadow-sm"
            id="room-presentation-btn"
          >
            <Tv className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Presentation Mode</span>
            <span className="sm:hidden">Present</span>
          </button>

          {/* Quick Share */}
          <button
            onClick={() => {
              sounds.playSelect();
              onShare();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] transition cursor-pointer"
            id="room-share-btn"
            title="Share Poll Code & QR"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Secondary Actions Dropdown (Progressive Disclosure) */}
          <div className="relative">
            <button
              onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
              className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
              title="More Actions"
              id="room-menu-btn"
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            {showSecondaryMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/[0.1] bg-[#0E1118] p-1.5 shadow-2xl z-30 space-y-1 text-xs">
                <button
                  onClick={() => {
                    setShowSecondaryMenu(false);
                    setIsAnalyticsOpen(true);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
                >
                  <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Timeline Analytics</span>
                </button>

                <button
                  onClick={() => {
                    setShowSecondaryMenu(false);
                    onOpenVote(poll.id);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
                >
                  <Radio className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Vote Remote</span>
                </button>

                <button
                  onClick={() => {
                    setShowSecondaryMenu(false);
                    exportCSV();
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-violet-400" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => {
                    setShowSecondaryMenu(false);
                    onOpenRedisInspector();
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
                >
                  <Database className="h-3.5 w-3.5 text-amber-400" />
                  <span>Redis Telemetry</span>
                </button>

                <div className="my-1 border-t border-white/[0.06]" />

                <button
                  onClick={() => {
                    setShowSecondaryMenu(false);
                    handleToggleClosePoll();
                  }}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer"
                >
                  {poll.is_closed ? (
                    <>
                      <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Re-open Voting</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Lock Voting</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Centerpiece Question & Live Telemetry Strip */}
      <div className="space-y-4">
        {/* Personality & Event Widget Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm"
            style={{
              backgroundColor: currentTheme.accentColors?.badgeBg,
              borderColor: currentTheme.accentColors?.badgeBorder,
              color: currentTheme.accentColors?.badgeText,
            }}
          >
            {currentTheme.personalityLabel}
          </span>
          {currentTheme.visualDetails?.widgetLabel && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderColor: currentTheme.accentColors?.border || 'rgba(255,255,255,0.1)',
                color: currentTheme.accentColors?.primary || '#38bdf8',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-ping" style={{ backgroundColor: currentTheme.accentColors?.primary || '#38bdf8' }} />
              <span>{currentTheme.visualDetails.widgetLabel}: {currentTheme.visualDetails.widgetText}</span>
            </span>
          )}
          {currentTheme.visualDetails?.personalityBadge && (
            <span className="text-[11px] font-mono text-zinc-400">
              {currentTheme.visualDetails.personalityBadge}
            </span>
          )}
        </div>

        <h1 className={`${currentTheme.typography?.titleClass || 'text-3xl sm:text-4xl lg:text-5xl font-extrabold'} leading-tight tracking-tight`}>
          {poll.title}
        </h1>
        {poll.description && (
          <p className={`${currentTheme.typography?.descriptionClass || 'text-sm sm:text-base text-zinc-400'} max-w-3xl leading-relaxed`}>
            {poll.description}
          </p>
        )}

        {/* Minimal Live Stats Strip */}
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Total Pulses</span>
            <span className="text-lg font-bold text-white">{poll.total_votes}</span>
          </div>

          <div className="h-3 w-px bg-white/[0.1]" />

          <div className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-white font-bold">+{velocity}</span>
            <span className="text-zinc-400">pulses/min</span>
            {velocityTrend === 'increasing' && <TrendingUp className="h-3 w-3 text-emerald-400 ml-1" />}
            {velocityTrend === 'decreasing' && <TrendingDown className="h-3 w-3 text-amber-400 ml-1" />}
            {velocityTrend === 'steady' && <Minus className="h-3 w-3 text-zinc-400 ml-1" />}
          </div>

          <div className="h-3 w-px bg-white/[0.1]" />

          <div className="flex items-center gap-1.5 text-zinc-400">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            <span>Anonymous Room</span>
          </div>
        </div>
      </div>

      {/* THE VISUAL CENTERPIECE: PULSE FIELD */}
      <div className="pt-2">
        <PulseField
          options={poll.options}
          totalVotes={poll.total_votes}
          pulsingOptionId={pulsingOptionId}
          reducedMotion={reducedMotion}
          theme={currentTheme}
        />
      </div>

      {/* Bottom Section: Signal Stream + Discreet Anonymous Reactions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Signal Stream (Audit Log) */}
        <div className="md:col-span-2 rounded-2xl border border-white/[0.07] bg-[#090A0F] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span className="uppercase tracking-wider">Signal Stream</span>
            </div>
            <span>Realtime Audit</span>
          </div>

          {activityFeed.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-400 font-mono">
              Awaiting audience pulses... Room is quiet.
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {activityFeed.map((ev) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span className="text-zinc-300 truncate font-sans">{ev.text}</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400 shrink-0 ml-2">{ev.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Discreet Reactions Module */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#090A0F] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-3">
              Audience Pulse Reactions
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Tap an emoji to send an anonymous live impulse wave across the room.
            </p>
          </div>

          <LiveReactionsOverlay
            pollId={poll.id}
            reactions={reactions}
            reducedMotion={reducedMotion}
            incomingReaction={incomingReaction}
            showBar={true}
            variant="bar-only"
          />
        </div>
      </div>

      {/* Presentation Fullscreen Mode Modal */}
      {isPresentationOpen && (
        <PresentationModeView
          initialPoll={poll}
          onClose={() => setIsPresentationOpen(false)}
          reducedMotion={reducedMotion}
          theme={currentTheme}
        />
      )}

      {/* Analytics Timeline Modal */}
      <CreatorAnalyticsModal
        pollId={poll.id}
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </div>
  );
};

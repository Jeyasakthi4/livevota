import React, { useState, useEffect } from 'react';
import {
  Radio,
  CheckCircle2,
  AlertCircle,
  Share2,
  Lock,
  UserCheck,
  KeyRound,
  ArrowRight,
  Tv,
  GraduationCap,
  Briefcase,
  Zap,
  Timer,
  Trophy,
  Lightbulb,
  PartyPopper,
  BarChart2,
  Globe,
  Sparkles,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Poll, User, EventPersonalityType, VoteEvent } from '../types';
import { api, connectPollWebSocket } from '../services/api';
import { LiveReactionsOverlay } from './LiveReactionsOverlay';
import { sounds } from '../utils/soundEffects';
import { getThemeForPoll, PulseTheme } from '../utils/themeManager';
import { ThemedEventBackground } from './ThemedEventBackground';

interface AudienceVoteViewProps {
  poll: Poll;
  user: User | null;
  hasVotedInitially: boolean;
  onViewResults: (pollId: string) => void;
  onShare: () => void;
  onOpenAuth: (context?: { title?: string; subtitle?: string; notice?: string }) => void;
}

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const EVENT_ICONS: Record<string, React.ElementType> = {
  classroom: GraduationCap,
  'team-work': Briefcase,
  'live-event': Zap,
  quiz: Timer,
  competition: Trophy,
  brainstorm: Lightbulb,
  'party-social': PartyPopper,
  survey: BarChart2,
  conference: Globe,
};

const EVENT_SPECIAL_WIDGETS: Record<
  EventPersonalityType,
  {
    icon: React.ElementType;
    title: string;
    description: string;
    chipText: string;
  }
> = {
  classroom: {
    icon: GraduationCap,
    title: 'ACADEMIC LECTURE HUD',
    description: 'Lecture comprehension active · Concept check in progress',
    chipText: 'EDUCATIONAL CALM',
  },
  'team-work': {
    icon: Briefcase,
    title: 'EXECUTIVE SPRINT RETRO',
    description: 'Confidential engineering alignment · Razor precision',
    chipText: 'EXECUTIVE PRECISION',
  },
  'live-event': {
    icon: Zap,
    title: 'STADIUM SOUND STAGE',
    description: 'Live crowd momentum steering DJ lighting & audio mix',
    chipText: '98.4 dB SURGE',
  },
  quiz: {
    icon: Timer,
    title: 'SPEED TRIVIA ARENA',
    description: '⏱ 00:45 Countdown round active · Lock in your answer',
    chipText: 'ROUND TIMER',
  },
  competition: {
    icon: Trophy,
    title: 'CHAMPIONSHIP PODIUM RACE',
    description: '🏆 Realtime leaderboard battle · Audience votes shift rank',
    chipText: 'PODIUM RACE',
  },
  brainstorm: {
    icon: Lightbulb,
    title: 'CREATIVE STUDIO HORIZON',
    description: 'Organic concept cluster floating · Open idea exploration',
    chipText: 'IDEA HORIZON',
  },
  'party-social': {
    icon: PartyPopper,
    title: 'CELEBRATION GALA VIBE',
    description: '🎉 Midnight toast active · Cheers and high-energy crowd reactions',
    chipText: 'TOAST & CHEER',
  },
  survey: {
    icon: BarChart2,
    title: 'EMPIRICAL MATRIX TELEMETRY',
    description: 'Quantitative metric telemetry · Statistical bounds CI 95%',
    chipText: 'CI 95% METRIC',
  },
  conference: {
    icon: Globe,
    title: 'KEYNOTE AUDITORIUM BROADCAST',
    description: 'Main auditorium 4K interactive display synchronized',
    chipText: '4K BROADCAST',
  },
};

export const AudienceVoteView: React.FC<AudienceVoteViewProps> = ({
  poll,
  user,
  hasVotedInitially,
  onViewResults,
  onShare,
  onOpenAuth,
}) => {
  const [currentPoll, setCurrentPoll] = useState<Poll>(poll);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(hasVotedInitially);
  const [error, setError] = useState<string | null>(null);
  const [votedOptionName, setVotedOptionName] = useState<string | null>(null);
  const [receiptHash, setReceiptHash] = useState<string | null>(null);
  const [incomingReaction, setIncomingReaction] = useState<{ emoji: string; id: string } | null>(null);
  const [wsConnected, setWsConnected] = useState(true);

  // Sync poll prop changes
  useEffect(() => {
    setCurrentPoll(poll);
  }, [poll]);

  // Truly Real-Time WebSocket Connection: Zero-refresh vote updates & reactions
  useEffect(() => {
    const disconnect = connectPollWebSocket(
      currentPoll.id,
      (event: VoteEvent) => {
        if (event.type === 'vote' || event.type === 'init') {
          setCurrentPoll((prev) => {
            const updatedOptions = prev.options.map((opt) => {
              const match = event.options?.find((o) => o.id === opt.id);
              if (match) {
                return { ...opt, votes: match.votes, percentage: match.percentage };
              }
              return opt;
            });
            return {
              ...prev,
              total_votes: event.total_votes !== undefined ? event.total_votes : prev.total_votes,
              options: updatedOptions,
              is_closed: event.is_closed !== undefined ? event.is_closed : prev.is_closed,
            };
          });
        } else if (event.type === 'status') {
          setCurrentPoll((prev) => ({
            ...prev,
            is_closed: Boolean(event.is_closed),
            total_votes: event.total_votes !== undefined ? event.total_votes : prev.total_votes,
            options: event.options || prev.options,
          }));
        } else if (event.type === 'reaction' && event.emoji) {
          if (event.reactions) {
            setCurrentPoll((prev) => ({ ...prev, reactions: event.reactions }));
          }
          setIncomingReaction({
            emoji: event.emoji,
            id: `react_${Date.now()}_${Math.random()}`,
          });
        }
      },
      (connected) => setWsConnected(connected)
    );

    return () => disconnect();
  }, [currentPoll.id]);

  // Dynamically resolve the theme according to the event
  const theme: PulseTheme = getThemeForPoll(currentPoll);
  const personality = (currentPoll.personality || theme.personality) as EventPersonalityType;
  const EventIcon = EVENT_ICONS[personality] || Sparkles;
  const eventWidget = EVENT_SPECIAL_WIDGETS[personality];

  useEffect(() => {
    setHasVoted(hasVotedInitially);
  }, [hasVotedInitially]);

  // Keyboard shortcut listener (1-9, A-D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (hasVoted || currentPoll.is_closed) return;

      const key = e.key.toUpperCase();
      const num = parseInt(key, 10);
      if (!isNaN(num) && num >= 1 && num <= currentPoll.options.length) {
        e.preventDefault();
        const opt = currentPoll.options[num - 1];
        if (opt) {
          sounds.playSelect();
          setSelectedOptionId(opt.id);
        }
      }
      const letterIndex = OPTION_KEYS.indexOf(key);
      if (letterIndex !== -1 && letterIndex < currentPoll.options.length) {
        e.preventDefault();
        const opt = currentPoll.options[letterIndex];
        if (opt) {
          sounds.playSelect();
          setSelectedOptionId(opt.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPoll.options, hasVoted, currentPoll.is_closed]);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      sounds.playSelect();
      onOpenAuth({
        title: 'Voter Verification Required',
        subtitle: 'Sign in to record your verified pulse',
        notice: 'Anti-duplicate protection: votes are linked to verified accounts and deduplicated in Redis.',
      });
      return;
    }

    if (!selectedOptionId) {
      setError('Please tap an option before submitting.');
      return;
    }

    if (currentPoll.is_closed) {
      setError('This poll room is closed.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.submitVote(currentPoll.id, selectedOptionId, user.username);
      sounds.playVoteSuccess();

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: theme.palette.map((p) => p.accent),
      });

      const opt = currentPoll.options.find((o) => o.id === selectedOptionId);
      setVotedOptionName(opt ? opt.text : 'Selected Option');
      setReceiptHash(`PULSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      setHasVoted(true);
    } catch (err: any) {
      if (err.code === 'ALREADY_VOTED' || err.status === 409) {
        setHasVoted(true);
        setError('Your vote was already recorded for this poll.');
      } else if (err.code === 'UNAUTHORIZED' || err.status === 401) {
        onOpenAuth({
          title: 'Session Expired',
          subtitle: 'Please sign in again to submit your pulse.',
        });
      } else {
        setError(err.message || 'Failed to submit vote.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isVotingDisabled = currentPoll.is_closed || hasVoted;

  return (
    <div
      style={theme.cssVariables as React.CSSProperties}
      className="mx-auto max-w-xl px-4 py-8 sm:px-6 relative space-y-6 transition-colors duration-500"
    >
      {/* Impressive Architectural Event Background */}
      <ThemedEventBackground personality={personality} theme={theme} variant="fullscreen" opacity={1} />

      {/* Top Header Remote Actions & Event Identity */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Room Code Badge with Live Realtime Status */}
          <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-lg">
            <span
              className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
            />
            <span>ROOM · {currentPoll.code}</span>
            <span className="text-[10px] text-zinc-500 font-normal">({currentPoll.total_votes} {currentPoll.total_votes === 1 ? 'vote' : 'votes'})</span>
          </div>

          {/* Event Personality Badge */}
          <span
            className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
            style={{
              backgroundColor: theme.accentColors?.badgeBg,
              borderColor: theme.accentColors?.badgeBorder,
              color: theme.accentColors?.badgeText,
            }}
          >
            <EventIcon className="h-3 w-3" />
            <span>{theme.personalityLabel}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playSelect();
              onShare();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.08] transition cursor-pointer"
            id="vote-share-btn"
          >
            <Share2 className="h-3.5 w-3.5 text-zinc-400" />
            <span>Share</span>
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onViewResults(currentPoll.id);
            }}
            style={{
              backgroundColor: theme.accentColors?.primary || '#ffffff',
              color: '#000000',
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold hover:brightness-110 active:scale-[0.98] transition cursor-pointer shadow-sm"
            id="vote-results-btn"
          >
            <Tv className="h-3.5 w-3.5 text-black" />
            <span>Live Stage</span>
          </button>
        </div>
      </div>

      {/* Main Ballot Card Styled by Event Theme with Atmospheric Glassmorphism */}
      <div
        style={{
          backgroundColor: 'rgba(10, 14, 22, 0.78)',
          borderColor: theme.accentColors?.border || 'rgba(255,255,255,0.12)',
        }}
        className="relative rounded-2xl border p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden"
      >
        {/* Subtle interior atmospheric glow */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: theme.atmosphere?.previewGradient }}
        />

        {/* Special Event Widget Banner */}
        {eventWidget && (
          <div
            className="relative flex items-center justify-between gap-3 rounded-xl border p-3 text-xs font-mono backdrop-blur-md"
            style={{
              backgroundColor: theme.accentColors?.badgeBg,
              borderColor: theme.accentColors?.badgeBorder,
              color: theme.accentColors?.badgeText,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <eventWidget.icon
                className="h-4 w-4 shrink-0"
                style={{ color: theme.accentColors?.primary }}
              />
              <div className="min-w-0">
                <div className="font-bold tracking-wide uppercase">{eventWidget.title}</div>
                <div className="text-[11px] opacity-80 truncate">{eventWidget.description}</div>
              </div>
            </div>

            <span
              className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border"
              style={{
                borderColor: theme.accentColors?.badgeBorder,
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}
            >
              {eventWidget.chipText}
            </span>
          </div>
        )}

        {/* Title & Description with Event-Themed Typography */}
        <div className="space-y-2">
          <h1
            className={`${
              theme.typography?.titleClass || 'text-2xl sm:text-3xl font-extrabold tracking-tight'
            } text-white leading-snug`}
          >
            {currentPoll.title}
          </h1>
          {currentPoll.description && (
            <p
              className={`${
                theme.typography?.descriptionClass || 'text-sm text-zinc-400'
              } leading-relaxed`}
            >
              {currentPoll.description}
            </p>
          )}
        </div>

        {/* User Status Strip */}
        {user && !hasVoted && !currentPoll.is_closed && (
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <UserCheck
                className="h-3.5 w-3.5"
                style={{ color: theme.accentColors?.primary || '#38bdf8' }}
              />
              <span>
                Voting as <strong className="text-zinc-200">{user.username}</strong>
              </span>
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{ color: theme.accentColors?.primary || '#34d399' }}
            >
              VERIFIED
            </span>
          </div>
        )}

        {/* Closed Poll Alert */}
        {currentPoll.is_closed && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>This poll has concluded. Check the Live Stage to view final results.</span>
          </div>
        )}

        {/* Post-Vote Verified Receipt & Live Real-Time Results Notification */}
        {hasVoted && (
          <div
            className="rounded-xl border p-4 space-y-2 text-xs shadow-inner"
            style={{
              backgroundColor: theme.accentColors?.badgeBg,
              borderColor: theme.accentColors?.badgeBorder,
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 font-semibold"
                style={{ color: theme.accentColors?.primary || '#34d399' }}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Pulse Recorded · Live Zero-Refresh Results</span>
              </div>
              {receiptHash && (
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    borderColor: theme.accentColors?.badgeBorder,
                    color: theme.accentColors?.badgeText,
                  }}
                >
                  {receiptHash}
                </span>
              )}
            </div>
            {votedOptionName && (
              <p className="text-zinc-200">
                You selected: <strong className="text-white font-bold">{votedOptionName}</strong>
              </p>
            )}
            <p className="text-[11px] text-zinc-400">
              Option bars below update dynamically in real time without refreshing as attendees vote.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Option Selection Form / Live Real-Time Tally */}
        <form onSubmit={handleVoteSubmit} className="space-y-3">
          {currentPoll.options.map((opt, idx) => {
            const isSelected = selectedOptionId === opt.id;
            const letter = OPTION_KEYS[idx] || `${idx + 1}`;
            const paletteEntry = theme.palette[idx % theme.palette.length];
            const pct = typeof opt.percentage === 'number' ? opt.percentage : 0;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isVotingDisabled}
                onClick={() => {
                  if (!isVotingDisabled) {
                    sounds.playSelect();
                    setSelectedOptionId(opt.id);
                  }
                }}
                style={{
                  borderColor: isSelected
                    ? paletteEntry.accent
                    : 'rgba(255,255,255,0.08)',
                  backgroundColor: isSelected
                    ? `${paletteEntry.accent}18`
                    : 'rgba(255,255,255,0.02)',
                  boxShadow: isSelected
                    ? `0 0 20px ${paletteEntry.accent}30`
                    : 'none',
                }}
                className={`w-full min-h-[56px] relative flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 ease-out cursor-pointer select-none overflow-hidden ${
                  isVotingDisabled && !hasVoted ? 'opacity-40 cursor-not-allowed' : ''
                } ${!hasVoted ? 'active:scale-[0.975] hover:border-white/[0.25] hover:scale-[1.006]' : ''}`}
              >
                {/* Truly Real-Time Dynamic Progress Fill when voted */}
                {hasVoted && (
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-500 ease-out pointer-events-none"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: paletteEntry.accent,
                      opacity: 0.16,
                    }}
                  />
                )}

                <div className="flex items-center gap-3 min-w-0 z-10 relative">
                  {/* Option Letter Badge with Event Themed Color */}
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold transition shadow-sm"
                    style={{
                      backgroundColor: isSelected ? paletteEntry.accent : 'rgba(255,255,255,0.06)',
                      color: isSelected ? '#000000' : '#d4d4d8',
                      borderColor: paletteEntry.accent,
                    }}
                  >
                    {letter}
                  </span>
                  <span
                    className={`${
                      theme.typography?.labelClass || 'text-sm sm:text-base font-semibold'
                    } text-zinc-100 truncate`}
                  >
                    {opt.text}
                  </span>
                </div>

                {/* Right Side: Radio Check Ring OR Live Dynamic Percent Bar */}
                <div className="z-10 relative shrink-0">
                  {hasVoted ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-400">
                        {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                      </span>
                      <span
                        className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: `${paletteEntry.accent}20`,
                          borderColor: `${paletteEntry.accent}50`,
                          color: paletteEntry.accent,
                        }}
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <div
                      className="h-4 w-4 shrink-0 rounded-full border transition-all flex items-center justify-center"
                      style={{
                        borderColor: isSelected ? paletteEntry.accent : '#52525b',
                        backgroundColor: isSelected ? paletteEntry.accent : 'transparent',
                      }}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-black" />}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Action Button Styled with Event Theme Primary Accent */}
          <div className="pt-2">
            {!user && !hasVoted && !currentPoll.is_closed ? (
              <button
                type="button"
                onClick={() =>
                  onOpenAuth({
                    title: 'Voter Sign In Required',
                    subtitle: 'Sign in to record your verified pulse',
                    notice: 'Anti-duplicate protection: votes are linked to verified accounts.',
                  })
                }
                style={{
                  backgroundColor: theme.accentColors?.primary || '#ffffff',
                  color: '#000000',
                }}
                className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-bold hover:brightness-110 transition cursor-pointer shadow-lg active:scale-[0.99]"
                id="vote-auth-btn"
              >
                <Lock className="h-4 w-4" />
                <span>Sign in to Transmit Pulse</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isVotingDisabled || !selectedOptionId || loading}
                style={{
                  backgroundColor:
                    !isVotingDisabled && selectedOptionId
                      ? theme.accentColors?.primary || '#ffffff'
                      : '#27272a',
                  color: !isVotingDisabled && selectedOptionId ? '#000000' : '#71717a',
                }}
                className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-bold hover:brightness-110 hover:scale-[1.008] transition-all duration-200 ease-out disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer shadow-lg active:scale-[0.975]"
                id="vote-submit-btn"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    <span>Broadcasting to Room...</span>
                  </>
                ) : hasVoted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pulse Transmitted · Live Zero-Refresh Active</span>
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4" />
                    <span>Transmit Pulse ({theme.personalityLabel})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Live Reactions Pad */}
        <div className="pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-zinc-400">
            <span>Send Stage Reaction</span>
            <span className="text-[10px] flex items-center gap-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Realtime WebSocket Broadcast
            </span>
          </div>

          <LiveReactionsOverlay
            pollId={currentPoll.id}
            reactions={currentPoll.reactions || {}}
            reducedMotion={false}
            incomingReaction={incomingReaction}
            showBar={true}
            variant="bar-only"
          />
        </div>
      </div>
    </div>
  );
};

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
import { Poll, User, EventPersonalityType } from '../types';
import { api } from '../services/api';
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
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(hasVotedInitially);
  const [error, setError] = useState<string | null>(null);
  const [votedOptionName, setVotedOptionName] = useState<string | null>(null);
  const [receiptHash, setReceiptHash] = useState<string | null>(null);

  // Dynamically resolve the theme according to the event
  const theme: PulseTheme = getThemeForPoll(poll);
  const personality = (poll.personality || theme.personality) as EventPersonalityType;
  const EventIcon = EVENT_ICONS[personality] || Sparkles;
  const eventWidget = EVENT_SPECIAL_WIDGETS[personality];

  useEffect(() => {
    setHasVoted(hasVotedInitially);
  }, [hasVotedInitially]);

  // Keyboard shortcut listener (1-9, A-D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (hasVoted || poll.is_closed) return;

      const key = e.key.toUpperCase();
      const num = parseInt(key, 10);
      if (!isNaN(num) && num >= 1 && num <= poll.options.length) {
        e.preventDefault();
        const opt = poll.options[num - 1];
        if (opt) {
          sounds.playSelect();
          setSelectedOptionId(opt.id);
        }
      }
      const letterIndex = OPTION_KEYS.indexOf(key);
      if (letterIndex !== -1 && letterIndex < poll.options.length) {
        e.preventDefault();
        const opt = poll.options[letterIndex];
        if (opt) {
          sounds.playSelect();
          setSelectedOptionId(opt.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [poll.options, hasVoted, poll.is_closed]);

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

    if (poll.is_closed) {
      setError('This poll room is closed.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.submitVote(poll.id, selectedOptionId, user.username);
      sounds.playVoteSuccess();

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: theme.palette.map((p) => p.accent),
      });

      const opt = poll.options.find((o) => o.id === selectedOptionId);
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

  const isVotingDisabled = poll.is_closed || hasVoted;

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
          {/* Room Code Badge */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-lg">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: theme.accentColors?.primary || '#10b981' }}
            />
            <span>ROOM · {poll.code}</span>
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
              onViewResults(poll.id);
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
            {poll.title}
          </h1>
          {poll.description && (
            <p
              className={`${
                theme.typography?.descriptionClass || 'text-sm text-zinc-400'
              } leading-relaxed`}
            >
              {poll.description}
            </p>
          )}
        </div>

        {/* User Status Strip */}
        {user && !hasVoted && !poll.is_closed && (
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
        {poll.is_closed && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>This poll has concluded. Check the Live Stage to view final results.</span>
          </div>
        )}

        {/* Post-Vote Verified Receipt */}
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
                <span>Pulse Recorded in Room · Event Theme Applied</span>
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
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Option Selection Form Styled According to Event Palette */}
        <form onSubmit={handleVoteSubmit} className="space-y-3">
          {poll.options.map((opt, idx) => {
            const isSelected = selectedOptionId === opt.id;
            const letter = OPTION_KEYS[idx] || `${idx + 1}`;
            const paletteEntry = theme.palette[idx % theme.palette.length];

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
                className={`w-full min-h-[56px] flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 ease-out cursor-pointer select-none active:scale-[0.975] ${
                  isVotingDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/[0.25] hover:scale-[1.006]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
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

                {/* Radio Check Ring */}
                <div
                  className="h-4 w-4 shrink-0 rounded-full border transition-all flex items-center justify-center"
                  style={{
                    borderColor: isSelected ? paletteEntry.accent : '#52525b',
                    backgroundColor: isSelected ? paletteEntry.accent : 'transparent',
                  }}
                >
                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-black" />}
                </div>
              </button>
            );
          })}

          {/* Action Button Styled with Event Theme Primary Accent */}
          <div className="pt-2">
            {!user && !hasVoted && !poll.is_closed ? (
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
                    <span>Pulse Verified in Room</span>
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
            <span className="text-[10px]">Realtime broadcast</span>
          </div>

          <LiveReactionsOverlay
            pollId={poll.id}
            reactions={poll.reactions || {}}
            reducedMotion={false}
            incomingReaction={null}
            showBar={true}
            variant="bar-only"
          />
        </div>
      </div>
    </div>
  );
};

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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Poll, User } from '../types';
import { api } from '../services/api';
import { LiveReactionsOverlay } from './LiveReactionsOverlay';
import { sounds } from '../utils/soundEffects';

interface AudienceVoteViewProps {
  poll: Poll;
  user: User | null;
  hasVotedInitially: boolean;
  onViewResults: (pollId: string) => void;
  onShare: () => void;
  onOpenAuth: (context?: { title?: string; subtitle?: string; notice?: string }) => void;
}

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

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
        colors: ['#06B6D4', '#8B5CF6', '#10B981'],
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
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 relative space-y-6">
      {/* Top Header Remote Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-widest text-zinc-400">
            ROOM · {poll.code}
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
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition cursor-pointer"
            id="vote-results-btn"
          >
            <Tv className="h-3.5 w-3.5" />
            <span>Live Stage</span>
          </button>
        </div>
      </div>

      {/* Main Ballot Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#090A0F] p-6 sm:p-8 space-y-6">
        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-sm text-zinc-400 leading-relaxed">
              {poll.description}
            </p>
          )}
        </div>

        {/* User Status Strip */}
        {user && !hasVoted && !poll.is_closed && (
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                Voting as <strong className="text-zinc-200">{user.username}</strong>
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">VERIFIED</span>
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
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Pulse Recorded in Room</span>
              </div>
              {receiptHash && (
                <span className="font-mono text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  {receiptHash}
                </span>
              )}
            </div>
            {votedOptionName && (
              <p className="text-zinc-300">
                You selected: <strong className="text-white font-semibold">{votedOptionName}</strong>
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

        {/* Option Selection - Touch Optimized (48px+ min hit target) */}
        <form onSubmit={handleVoteSubmit} className="space-y-3">
          {poll.options.map((opt, idx) => {
            const isSelected = selectedOptionId === opt.id;
            const letter = OPTION_KEYS[idx] || `${idx + 1}`;

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
                className={`w-full min-h-[56px] flex items-center justify-between rounded-xl border p-4 text-left transition-all cursor-pointer select-none active:scale-[0.99] ${
                  isSelected
                    ? 'border-violet-500/80 bg-violet-950/20 ring-1 ring-violet-500/50'
                    : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]'
                } ${isVotingDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/[0.06] text-zinc-400 border border-white/[0.08]'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-zinc-100 truncate font-sans">
                    {opt.text}
                  </span>
                </div>

                <div
                  className={`h-4 w-4 shrink-0 rounded-full border transition flex items-center justify-center ${
                    isSelected ? 'border-violet-400 bg-violet-500' : 'border-zinc-600'
                  }`}
                >
                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}

          {/* Action Button */}
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
                className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 px-6 text-sm font-semibold text-black hover:bg-zinc-200 transition cursor-pointer shadow-sm active:scale-[0.99]"
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
                className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 px-6 text-sm font-semibold text-black hover:bg-zinc-200 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-[0.99]"
                id="vote-submit-btn"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    <span>Broadcasting...</span>
                  </>
                ) : hasVoted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Pulse Verified</span>
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4" />
                    <span>Transmit Pulse</span>
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

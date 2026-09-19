import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Radio, Sparkles, Plus, QrCode } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface LandingHeroProps {
  onOpenCreate: () => void;
  onJoinCode: (code: string) => void;
  onOpenScanner: () => void;
  onExplorePolls: () => void;
  onExploreTemplates?: (category?: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onOpenCreate,
  onJoinCode,
  onOpenScanner,
  onExplorePolls,
  onExploreTemplates,
}) => {
  const [roomCode, setRoomCode] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      sounds.playSelect();
      onJoinCode(roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-14 lg:px-8">
      {/* Ambient delicate glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-48 right-1/4 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />

      {/* Hero Content Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-mono text-zinc-300">
          <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>REALTIME STAGE ARCHITECTURE</span>
          <span className="text-zinc-400">·</span>
          <span className="text-violet-300 font-sans">Linear / Minimalist</span>
        </div>

        {/* Core Statement: ASK. VOTE. WATCH THE ROOM CHANGE. */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
          ASK. VOTE.{' '}
          <span className="text-zinc-300">
            WATCH THE ROOM CHANGE.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed font-normal max-w-2xl mx-auto">
          Every vote creates a pulse. Sub-millisecond audience polling engineered for high-stakes keynotes, all-hands, and live broadcasts.
        </p>

        {/* Primary Clear Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition active:scale-[0.98] shadow-lg shadow-white/5 cursor-pointer"
            id="landing-create-poll-btn"
          >
            <Plus className="h-4 w-4 text-black" />
            <span>Create a Poll</span>
          </button>

          {/* Quick Room Code Input */}
          <form onSubmit={handleJoinSubmit} className="w-full sm:w-auto flex items-center gap-1.5">
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                placeholder="ROOM CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="w-full rounded-xl border border-white/[0.12] bg-[#0E1118] px-3.5 py-3 text-xs font-mono font-semibold tracking-wider text-white placeholder-zinc-400 focus:border-cyan-500 focus:outline-none"
                id="landing-room-code-input"
              />
            </div>
            <button
              type="submit"
              disabled={!roomCode.trim()}
              className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-xs font-semibold text-zinc-200 hover:bg-white/[0.1] hover:text-white transition disabled:opacity-40 cursor-pointer"
              id="landing-join-btn"
            >
              <Radio className="h-3.5 w-3.5 inline mr-1 text-cyan-400" />
              <span>Join</span>
            </button>
            <button
              type="button"
              onClick={onOpenScanner}
              className="rounded-xl border border-white/[0.1] bg-white/[0.05] p-3 text-zinc-300 hover:bg-white/[0.1] hover:text-white transition cursor-pointer"
              title="Scan QR Code"
              id="landing-scan-qr-btn"
            >
              <QrCode className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Quick Event Blueprint Shortcuts */}
        {onExploreTemplates && (
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              Event Blueprints:
            </span>
            <button
              type="button"
              onClick={() => onExploreTemplates('conference')}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[11px] text-zinc-300 hover:border-cyan-500/40 hover:text-white transition cursor-pointer active:scale-95"
            >
              <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
              <span>Conferences</span>
            </button>
            <button
              type="button"
              onClick={() => onExploreTemplates('team-work')}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[11px] text-zinc-300 hover:border-cyan-500/40 hover:text-white transition cursor-pointer active:scale-95"
            >
              <span>All-Hands</span>
            </button>
            <button
              type="button"
              onClick={() => onExploreTemplates('brainstorm')}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[11px] text-zinc-300 hover:border-cyan-500/40 hover:text-white transition cursor-pointer active:scale-95"
            >
              <span>Tech Talks</span>
            </button>
            <button
              type="button"
              onClick={() => onExploreTemplates('classroom')}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[11px] text-zinc-300 hover:border-cyan-500/40 hover:text-white transition cursor-pointer active:scale-95"
            >
              <span>Workshops</span>
            </button>
          </div>
        )}
      </div>

      {/* Subtle Quick Exploration Footnote */}
      <div className="mt-10 flex items-center justify-center gap-6 text-xs text-zinc-500 font-mono">
        <button
          onClick={onExplorePolls}
          className="text-zinc-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Browse Active Rooms Below</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

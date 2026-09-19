import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Maximize2,
  Minimize2,
  QrCode,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Poll, VoteEvent } from '../types';
import { connectPollWebSocket } from '../services/api';
import { PulseField } from './PulseField';
import { LiveReactionsOverlay } from './LiveReactionsOverlay';
import { QRCodeDisplay } from './QRCodeDisplay';
import { sounds } from '../utils/soundEffects';
import { PulseTheme, getThemeForPoll } from '../utils/themeManager';
import { ThemedEventBackground } from './ThemedEventBackground';
import { LiveVotaLogo } from './LiveVotaLogo';

interface PresentationModeViewProps {
  initialPoll: Poll;
  onClose: () => void;
  reducedMotion?: boolean;
  theme?: PulseTheme;
}

export const PresentationModeView: React.FC<PresentationModeViewProps> = ({
  initialPoll,
  onClose,
  reducedMotion = false,
  theme: customTheme,
}) => {
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [wsConnected, setWsConnected] = useState<boolean>(true);
  const [pulsingOptionId, setPulsingOptionId] = useState<string | null>(null);
  const [velocity, setVelocity] = useState<number>(0);
  const [velocityTrend, setVelocityTrend] = useState<'increasing' | 'steady' | 'decreasing'>('steady');
  const [showQR, setShowQR] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>(initialPoll.reactions || {});
  const [incomingReaction, setIncomingReaction] = useState<{ emoji: string; id: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeTheme = customTheme || getThemeForPoll(poll);

  // Fullscreen management & hotkeys
  useEffect(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') {
        setShowQR((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // WebSocket Live Real-Time Updates
  useEffect(() => {
    const disconnect = connectPollWebSocket(
      poll.id,
      (event: VoteEvent) => {
        if (event.type === 'vote' || event.type === 'init') {
          if (event.option_id) {
            setPulsingOptionId(event.option_id);
            sounds.playVoteSuccess();
            setTimeout(() => setPulsingOptionId(null), 800);
          }

          if (event.votes_per_minute !== undefined) {
            setVelocity(event.votes_per_minute);
          }
          if (event.velocity_trend) {
            setVelocityTrend(event.velocity_trend);
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
            sounds.playReactionBubble();
            setIncomingReaction({ emoji: event.emoji, id: String(Date.now()) });
          }
          if (event.reactions) {
            setReactions(event.reactions);
          }
        } else if (event.type === 'status') {
          setPoll((prev) => ({
            ...prev,
            is_closed: Boolean(event.is_closed),
          }));
        }
      },
      (connected) => setWsConnected(connected)
    );

    return () => disconnect();
  }, [poll.id]);

  const shareUrl = `${window.location.origin}/?poll=${poll.code}&mode=vote`;

  const toggleFullscreen = () => {
    sounds.playSelect();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      style={activeTheme.cssVariables as React.CSSProperties}
      className={`fixed inset-0 z-50 flex flex-col ${activeTheme.presentation?.stageBackdrop || 'bg-[#06070A]'} text-white overflow-hidden select-none transition-colors duration-500`}
    >
      {/* Impressive Fullscreen Architectural Event Background */}
      <ThemedEventBackground
        personality={activeTheme.personality}
        theme={activeTheme}
        variant="fullscreen"
        opacity={1}
      />

      {/* Floating Reaction Particles */}
      <LiveReactionsOverlay
        pollId={poll.id}
        reactions={reactions}
        reducedMotion={reducedMotion}
        incomingReaction={incomingReaction}
        showBar={false}
        variant="floating"
      />

      {/* Top Bar: Presenter HUD with Theme Identity */}
      <div className="relative flex items-center justify-between border-b border-white/[0.06] bg-black/40 px-4 sm:px-8 py-2.5 sm:py-3 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 pr-2 border-r border-white/[0.08]">
            <LiveVotaLogo size={22} />
            <span className="font-extrabold text-xs tracking-tight text-white font-sans hidden sm:inline">
              <span>LIVEV</span>
              <span className="text-[#FBB03B]">O</span>
              <span>TA</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-xs font-mono">
            <span className="text-zinc-500 text-[10px]">ROOM</span>
            <span className="font-bold text-white tracking-wider text-xs">{poll.code}</span>
          </div>

          <div
            className="flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase"
            style={{
              backgroundColor: activeTheme.accentColors?.badgeBg,
              borderColor: activeTheme.accentColors?.badgeBorder,
              color: activeTheme.accentColors?.badgeText,
            }}
          >
            <span>{activeTheme.presentation?.headerBadge || activeTheme.personalityLabel}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: activeTheme.accentColors?.primary || '#10b981' }}
            />
            <span className="hidden sm:inline">LIVE STAGE</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[11px] font-mono text-zinc-300">
            <Flame className="h-3 w-3 text-amber-400" />
            <span className="font-bold">+{velocity}</span>
            <span className="text-zinc-500 text-[10px]">vpm</span>
            {velocityTrend === 'increasing' && <TrendingUp className="h-3 w-3 text-emerald-400" />}
            {velocityTrend === 'decreasing' && <TrendingDown className="h-3 w-3 text-amber-400" />}
            {velocityTrend === 'steady' && <Minus className="h-3 w-3 text-zinc-500" />}
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Toggle QR */}
          <button
            onClick={() => {
              sounds.playSelect();
              setShowQR(!showQR);
            }}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
              showQR
                ? 'bg-white text-black border-white shadow-sm'
                : 'border-white/[0.1] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]'
            }`}
            title="Toggle Audience QR Code (Press Q)"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>QR Code</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="rounded-lg border border-white/[0.1] bg-white/[0.04] p-1.5 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Close */}
          <button
            onClick={() => {
              sounds.playSelect();
              onClose();
            }}
            className="rounded-lg border border-white/[0.1] bg-white/[0.04] p-1.5 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            title="Exit Presentation Mode (Esc)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Cinema Viewport - Single Page Guaranteed, No Vertical Scrolling */}
      <div className="relative flex flex-1 flex-col justify-between px-4 sm:px-8 lg:px-12 py-3 sm:py-4 overflow-hidden max-w-7xl mx-auto w-full z-10 min-h-0">
        {/* Stage Title Section */}
        <div className="text-center space-y-1 sm:space-y-1.5 shrink-0 mb-2 sm:mb-3">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-widest uppercase mb-0.5"
            style={{
              backgroundColor: activeTheme.leadPalette?.badgeBg,
              borderColor: activeTheme.leadPalette?.badgeBorder,
              color: activeTheme.leadPalette?.text,
            }}
          >
            {activeTheme.visualDetails?.personalityBadge}
          </div>

          <h1
            className={`${
              poll.title.length > 70
                ? 'text-xl sm:text-2xl md:text-3xl'
                : poll.title.length > 40
                ? 'text-2xl sm:text-3xl md:text-4xl'
                : 'text-2xl sm:text-4xl md:text-5xl'
            } font-black tracking-tight text-white leading-tight max-w-5xl mx-auto line-clamp-2`}
          >
            {poll.title}
          </h1>

          {poll.description && (
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl mx-auto line-clamp-1 font-normal">
              {poll.description}
            </p>
          )}
        </div>

        {/* The Live Pulse Field - Compact presentation variant ensuring zero overflow */}
        <div className="w-full flex-1 flex items-center justify-center min-h-0 overflow-hidden">
          <PulseField
            options={poll.options}
            totalVotes={poll.total_votes}
            pulsingOptionId={pulsingOptionId}
            reducedMotion={reducedMotion}
            theme={activeTheme}
            variant="presentation"
          />
        </div>

        {/* Discreet Stage Telemetry Footer */}
        <div className="shrink-0 pt-2 sm:pt-3 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-white">{poll.total_votes}</span>
            <span>pulses recorded live</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-zinc-400">
            <span>Join with code:</span>
            <span className="font-bold text-white tracking-widest px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
              {poll.code}
            </span>
          </div>

          <div className="flex items-center gap-3 text-zinc-400 text-[10px]">
            <span className="hidden md:inline">Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[9px]">F</kbd> for Fullscreen</span>
            <span className="hidden md:inline">Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[9px]">Q</kbd> for QR</span>
            <span>Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[9px]">Esc</kbd> to Exit</span>
          </div>
        </div>

        {/* Floating QR Modal if toggled */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bottom-12 right-6 sm:right-12 z-30 flex flex-col items-center rounded-2xl border border-white/[0.12] bg-[#0A0D15]/95 p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="mb-2 text-center">
                <span className="text-[10px] font-mono tracking-wider font-semibold block" style={{ color: activeTheme.leadPalette.text }}>
                  SCAN TO CAST PULSE
                </span>
                <span className="font-mono text-lg font-black text-white">{poll.code}</span>
              </div>
              <QRCodeDisplay value={shareUrl} size={140} showActions={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

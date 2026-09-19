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
      <div className="relative flex items-center justify-between border-b border-white/[0.06] bg-black/40 px-6 sm:px-12 py-4 backdrop-blur-md z-10">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 pr-2 border-r border-white/[0.08]">
            <LiveVotaLogo size={24} />
            <span className="font-extrabold text-xs tracking-tight text-white font-sans hidden sm:inline">
              <span>LIVEV</span>
              <span className="text-[#FBB03B]">O</span>
              <span>TA</span>
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-mono">
            <span className="text-zinc-500">ROOM</span>
            <span className="font-bold text-white tracking-wider">{poll.code}</span>
          </div>

          <div
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold tracking-wider uppercase"
            style={{
              backgroundColor: activeTheme.accentColors?.badgeBg,
              borderColor: activeTheme.accentColors?.badgeBorder,
              color: activeTheme.accentColors?.badgeText,
            }}
          >
            <span>{activeTheme.presentation?.headerBadge || activeTheme.personalityLabel}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: activeTheme.accentColors?.primary || '#10b981' }}
            />
            <span className="hidden sm:inline">LIVE STAGE</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-xs font-mono text-zinc-300">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-bold">+{velocity}</span>
            <span className="text-zinc-500">vpm</span>
            {velocityTrend === 'increasing' && <TrendingUp className="h-3 w-3 text-emerald-400" />}
            {velocityTrend === 'decreasing' && <TrendingDown className="h-3 w-3 text-amber-400" />}
            {velocityTrend === 'steady' && <Minus className="h-3 w-3 text-zinc-500" />}
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle QR */}
          <button
            onClick={() => {
              sounds.playSelect();
              setShowQR(!showQR);
            }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              showQR
                ? 'bg-white text-black border-white'
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
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-2 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Close */}
          <button
            onClick={() => {
              sounds.playSelect();
              onClose();
            }}
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-2 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            title="Exit Presentation Mode (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Cinema Viewport */}
      <div className="relative flex flex-1 flex-col justify-center px-6 sm:px-12 lg:px-20 py-8 overflow-y-auto max-w-6xl mx-auto w-full z-10">
        {/* Massive Stage Title styled per personality */}
        <div className="mb-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono font-bold tracking-widest uppercase"
            style={{
              backgroundColor: activeTheme.leadPalette?.badgeBg,
              borderColor: activeTheme.leadPalette?.badgeBorder,
              color: activeTheme.leadPalette?.text,
            }}
          >
            {activeTheme.visualDetails?.personalityBadge}
          </div>
          <h1 className={`${activeTheme.presentation?.titleSize || 'text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight'} text-white leading-tight`}>
            {poll.title}
          </h1>
          {poll.description && (
            <p className={`${activeTheme.typography?.descriptionClass || 'text-sm sm:text-lg text-zinc-400'} max-w-2xl mx-auto`}>
              {poll.description}
            </p>
          )}
        </div>

        {/* The Live Pulse Field */}
        <div className="w-full">
          <PulseField
            options={poll.options}
            totalVotes={poll.total_votes}
            pulsingOptionId={pulsingOptionId}
            reducedMotion={reducedMotion}
            theme={activeTheme}
          />
        </div>

        {/* Floating QR Modal if toggled */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bottom-8 right-8 z-30 flex flex-col items-center rounded-2xl border border-white/[0.12] bg-[#0A0D15]/95 p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="mb-2 text-center">
                <span className="text-[11px] font-mono tracking-wider font-semibold block" style={{ color: activeTheme.leadPalette.text }}>
                  SCAN TO CAST PULSE
                </span>
                <span className="font-mono text-xl font-black text-white">{poll.code}</span>
              </div>
              <QRCodeDisplay value={shareUrl} size={160} showActions={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

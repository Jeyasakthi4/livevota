import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

export interface FloatingReaction {
  id: string;
  emoji: string;
  leftPercent: number;
}

interface LiveReactionsOverlayProps {
  pollId: string;
  reactions: Record<string, number>;
  onReactionSent?: (emoji: string) => void;
  reducedMotion?: boolean;
  incomingReaction?: { emoji: string; id?: string } | null;
  showBar?: boolean;
  variant?: 'floating' | 'bar-only' | 'full';
}

const SUPPORTED_EMOJIS = ['🔥', '❤️', '👀', '🤔', '💡'];

export const LiveReactionsOverlay: React.FC<LiveReactionsOverlayProps> = ({
  pollId,
  reactions,
  onReactionSent,
  reducedMotion = false,
  incomingReaction = null,
  showBar = true,
  variant = 'full',
}) => {
  const [floatingList, setFloatingList] = useState<FloatingReaction[]>([]);
  const [sendingEmoji, setSendingEmoji] = useState<string | null>(null);

  // Trigger floating reaction whenever an incomingReaction is received
  useEffect(() => {
    if (!incomingReaction) return;
    triggerFloating(incomingReaction.emoji);
  }, [incomingReaction]);

  const triggerFloating = (emoji: string) => {
    if (reducedMotion) return;
    const newReaction: FloatingReaction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      emoji,
      leftPercent: 10 + Math.random() * 80, // Random horizontal position between 10% and 90%
    };

    setFloatingList((prev) => [...prev.slice(-15), newReaction]);

    setTimeout(() => {
      setFloatingList((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2400);
  };

  const handleSendReaction = async (emoji: string) => {
    triggerFloating(emoji);
    if (onReactionSent) onReactionSent(emoji);

    setSendingEmoji(emoji);
    setTimeout(() => setSendingEmoji(null), 300);

    try {
      await api.sendReaction(pollId, emoji);
    } catch (err) {
      console.warn('Reaction error:', err);
    }
  };

  return (
    <>
      {/* Floating Emojis Canvas */}
      {variant !== 'bar-only' && (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          <AnimatePresence>
            {floatingList.map((item) => (
              <motion.div
                key={item.id}
                initial={{
                  opacity: 1,
                  scale: 0.8,
                  y: '90vh',
                  x: `${item.leftPercent}vw`,
                }}
                animate={{
                  opacity: [1, 1, 0],
                  scale: [0.8, 1.4, 1.2],
                  y: '15vh',
                  x: `${item.leftPercent + (Math.random() * 8 - 4)}vw`,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.2,
                  ease: 'easeOut',
                }}
                className="absolute select-none text-3xl sm:text-4xl drop-shadow-md"
              >
                {item.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Interactive Reaction Bar */}
      {showBar && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-2 backdrop-blur-md shadow-lg">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 select-none">
            Live Reactions:
          </span>
          <div className="flex items-center gap-1.5">
            {SUPPORTED_EMOJIS.map((emoji) => {
              const count = reactions[emoji] || 0;
              const isSending = sendingEmoji === emoji;

              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendReaction(emoji)}
                  className={`group relative flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer select-none active:scale-95 ${
                    isSending
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                  title={`Send ${emoji} reaction`}
                >
                  <span className="text-sm transition group-hover:scale-125 group-active:scale-150 transform">
                    {emoji}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 group-hover:text-slate-200 font-medium">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

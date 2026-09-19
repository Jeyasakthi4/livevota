import React from 'react';

interface QuizAtmospherePreviewProps {
  isHovered: boolean;
}

export const QuizAtmospherePreview: React.FC<QuizAtmospherePreviewProps> = ({ isHovered }) => {
  return (
    <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-xl bg-[#0e0622] select-none border border-violet-500/20">
      {/* Dynamic Game-Show Trivia Spotlight */}
      <div
        className={`pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-2xl transition-all duration-700 ${
          isHovered
            ? 'opacity-80 scale-110 bg-[radial-gradient(circle,rgba(139,92,246,0.65)_0%,rgba(245,158,11,0.25)_45%,transparent_75%)]'
            : 'opacity-55 scale-100 bg-[radial-gradient(circle,rgba(139,92,246,0.45)_0%,rgba(245,158,11,0.18)_45%,transparent_75%)]'
        }`}
      />

      {/* Isometric Diamond Trivia Grid Background */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="quiz-preview-diamonds" width="36" height="36" patternUnits="userSpaceOnUse">
            <path
              d="M 18 0 L 36 18 L 18 36 L 0 18 Z"
              fill="none"
              stroke="rgba(245, 158, 11, 0.25)"
              strokeWidth="0.75"
            />
            <circle cx="18" cy="18" r="1.5" fill="rgba(168, 85, 247, 0.4)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#quiz-preview-diamonds)" />
      </svg>

      {/* Floating Trivia Particles (Question marks, Sparks) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className={`absolute bottom-4 left-6 text-xl font-mono font-black text-amber-400/40 transition-transform duration-700 ${
            isHovered ? '-translate-y-4 text-amber-300/70 scale-110' : ''
          } anim-quiz-symbol`}
          style={{ animationDuration: '8s' }}
        >
          ?
        </span>
        <span
          className={`absolute top-10 right-14 text-sm font-mono font-bold text-violet-300/40 transition-transform duration-700 ${
            isHovered ? '-translate-y-3 text-violet-300/75 scale-125' : ''
          } anim-quiz-symbol`}
          style={{ animationDelay: '2s', animationDuration: '10s' }}
        >
          ✦
        </span>
        <span
          className={`absolute bottom-10 right-8 text-lg font-mono font-black text-amber-300/35 transition-transform duration-700 ${
            isHovered ? '-translate-y-4 text-amber-300/60 scale-110' : ''
          } anim-quiz-symbol`}
          style={{ animationDelay: '4s', animationDuration: '9s' }}
        >
          ?
        </span>
        <span
          className="absolute top-14 left-16 text-xs font-mono font-bold text-purple-400/30 anim-quiz-symbol"
          style={{ animationDelay: '1.5s', animationDuration: '11s' }}
        >
          ◇
        </span>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-950/70 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-violet-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>BUZZER ARENA</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400">
              TRIVIA SPEED ROUND
            </span>
          </div>

          {/* Interactive Countdown Timer Badge */}
          <div className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-300 anim-countdown-buzzer backdrop-blur-sm">
            <span className="text-[10px]">⏱</span>
            <span>00:15s</span>
          </div>
        </div>

        {/* Center Poll Visualization: Game-Show Question & Interactive Buzzers */}
        <div className="space-y-2 rounded-lg border border-violet-500/20 bg-black/55 p-3 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-200 truncate pr-2">
              Which protocol guarantees strict serializability?
            </span>
            <span className="font-mono text-[10px] font-bold text-amber-400 shrink-0">
              ✦ BUZZER ACTIVE
            </span>
          </div>

          {/* Choice A: Leading with Gold Buzzer */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-amber-400 font-mono text-[9px] font-black text-black shadow-xs">
                  A
                </span>
                <span className="font-medium text-white">Two-Phase Locking (Strict 2PL)</span>
              </div>
              <span className="font-mono font-bold text-amber-300">74%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-amber-400 to-amber-300 transition-all duration-500"
                style={{
                  width: isHovered ? '78%' : '74%',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)',
                }}
              />
            </div>
          </div>

          {/* Choice B */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-white/[0.1] font-mono text-[9px] font-bold text-zinc-300">
                  B
                </span>
                <span className="font-medium text-zinc-400">Optimistic Concurrency Control</span>
              </div>
              <span className="font-mono font-bold text-zinc-400">26%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-600/70 transition-all duration-500"
                style={{ width: isHovered ? '22%' : '26%' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Interactive Footnote */}
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
          <span className="text-amber-400/90 font-medium">⚡ Speed trivia energy</span>
          <span className="text-zinc-400">Lock-in buzzer countdown</span>
        </div>
      </div>
    </div>
  );
};

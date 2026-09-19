import React from 'react';
import { Presentation } from 'lucide-react';

interface ConferenceAtmospherePreviewProps {
  isHovered: boolean;
}

export const ConferenceAtmospherePreview: React.FC<ConferenceAtmospherePreviewProps> = ({
  isHovered,
}) => {
  return (
    <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-xl bg-[#040816] select-none border border-indigo-500/25">
      {/* 3D Perspective Stage Floor Geometry with Converging Perspective Lines */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="conf-floor-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {/* Converging stage rays */}
        <line x1="200" y1="50" x2="-20" y2="240" stroke="rgba(99, 102, 241, 0.35)" strokeWidth="1" />
        <line x1="200" y1="50" x2="80" y2="240" stroke="rgba(99, 102, 241, 0.35)" strokeWidth="1" />
        <line x1="200" y1="50" x2="200" y2="240" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="1.25" />
        <line x1="200" y1="50" x2="320" y2="240" stroke="rgba(99, 102, 241, 0.35)" strokeWidth="1" />
        <line x1="200" y1="50" x2="420" y2="240" stroke="rgba(99, 102, 241, 0.35)" strokeWidth="1" />

        {/* Stage horizontal depth bands */}
        <line x1="40" y1="120" x2="360" y2="120" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="0.75" />
        <line x1="10" y1="160" x2="390" y2="160" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="0.75" />
        <line x1="-20" y1="210" x2="420" y2="210" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" />
      </svg>

      {/* Volumetric Stage Spotlight Cone */}
      <div
        className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl transition-all duration-700 ${
          isHovered
            ? 'opacity-80 scale-110 bg-[radial-gradient(circle,rgba(56,189,248,0.5)_0%,rgba(99,102,241,0.28)_45%,transparent_75%)]'
            : 'opacity-50 scale-100 bg-[radial-gradient(circle,rgba(56,189,248,0.32)_0%,rgba(99,102,241,0.18)_45%,transparent_75%)]'
        }`}
      />

      {/* Stage Horizon Laser Sweep Line */}
      <div
        className="pointer-events-none absolute bottom-1/3 inset-x-0 h-0.5 opacity-40 anim-conference-horizon"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.8) 50%, transparent 100%)',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-indigo-500/35 bg-indigo-950/70 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
              <span>KEYNOTE STAGE</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400">
              AUDITORIUM STEERING
            </span>
          </div>

          {/* Broadcast Resolution Badge */}
          <div className="flex items-center gap-1.5 rounded-md border border-sky-500/35 bg-sky-950/50 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-200 backdrop-blur-sm">
            <Presentation className="h-3 w-3 text-sky-400" />
            <span>4K STAGE BROADCAST</span>
          </div>
        </div>

        {/* Center Poll Visualization: Big-Screen Presentation Results */}
        <div className="space-y-2 rounded-lg border border-indigo-500/25 bg-black/65 p-3 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-200 truncate pr-2">
              Auditorium Steering: Keynote Deep-Dive Focus
            </span>
            <span className="font-mono text-[9px] font-bold text-sky-400 uppercase tracking-wider shrink-0">
              ✦ STAGE DISPLAY
            </span>
          </div>

          {/* Option 1: AI Workflows (Stage Leader) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                <span className="font-bold text-white">Agentic AI Workflows in Production</span>
              </div>
              <span className="font-mono font-bold text-sky-300">54%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-300 transition-all duration-500"
                style={{
                  width: isHovered ? '58%' : '54%',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.65)',
                }}
              />
            </div>
          </div>

          {/* Option 2: Distributed Architecture */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <span className="font-medium text-zinc-300">Distributed Microservice Resilience</span>
              </div>
              <span className="font-mono font-bold text-indigo-300">30%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500/70 transition-all duration-500"
                style={{ width: isHovered ? '28%' : '30%' }}
              />
            </div>
          </div>

          {/* Option 3 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span className="font-medium text-zinc-400">Developer Ergonomics & Tooling</span>
              </div>
              <span className="font-mono font-bold text-zinc-400">16%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-700/60 transition-all duration-500"
                style={{ width: '16%' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Conference Footer */}
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
          <span className="text-sky-300/90 font-medium">✦ 3D perspective stage geometry</span>
          <span className="text-zinc-400">Cinematic keynote beams</span>
        </div>
      </div>
    </div>
  );
};

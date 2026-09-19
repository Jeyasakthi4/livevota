import React from 'react';
import { Lightbulb } from 'lucide-react';

interface BrainstormAtmospherePreviewProps {
  isHovered: boolean;
}

export const BrainstormAtmospherePreview: React.FC<BrainstormAtmospherePreviewProps> = ({
  isHovered,
}) => {
  return (
    <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-xl bg-[#090a1e] select-none border border-purple-500/25">
      {/* Studio Aurora Lavender & Mint Glows */}
      <div
        className={`pointer-events-none absolute -top-16 left-1/4 w-64 h-64 rounded-full blur-2xl transition-all duration-700 ${
          isHovered
            ? 'opacity-85 scale-115 bg-[radial-gradient(circle,rgba(168,85,247,0.55)_0%,rgba(99,102,241,0.25)_50%,transparent_75%)]'
            : 'opacity-55 scale-100 bg-[radial-gradient(circle,rgba(168,85,247,0.38)_0%,rgba(99,102,241,0.18)_50%,transparent_75%)]'
        }`}
      />
      <div
        className={`pointer-events-none absolute top-1/3 -right-8 w-56 h-56 rounded-full blur-2xl transition-all duration-700 ${
          isHovered
            ? 'opacity-75 scale-110 bg-[radial-gradient(circle,rgba(52,211,153,0.45)_0%,rgba(16,185,129,0.2)_45%,transparent_75%)]'
            : 'opacity-45 scale-100 bg-[radial-gradient(circle,rgba(52,211,153,0.28)_0%,rgba(16,185,129,0.12)_45%,transparent_75%)]'
        }`}
      />

      {/* Floating Constellation Vectors Connecting Idea Nodes */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 40 70 Q 120 40 220 75 T 380 60"
          fill="none"
          stroke="rgba(192, 132, 252, 0.5)"
          strokeWidth="1.25"
          className="anim-brainstorm-dash"
        />
        <path
          d="M 60 170 Q 180 200 290 150 T 420 180"
          fill="none"
          stroke="rgba(52, 211, 153, 0.45)"
          strokeWidth="1"
          className="anim-brainstorm-dash"
        />
        {/* Constellation Nodes */}
        <circle cx="40" cy="70" r="3" fill="#c084fc" className={isHovered ? 'anim-node-pulse' : ''} />
        <circle cx="220" cy="75" r="3.5" fill="#34d399" className={isHovered ? 'anim-node-pulse' : ''} />
        <circle cx="380" cy="60" r="3" fill="#818cf8" />
        <circle cx="290" cy="150" r="3" fill="#34d399" />
      </svg>

      {/* Floating Abstract Idea Card / Thought Bubble Sketches */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Micro Wireframe Idea Card */}
        <div
          className={`absolute top-10 right-6 w-14 h-9 rounded-md border border-purple-400/30 bg-purple-950/40 p-1 backdrop-blur-xs transition-transform duration-700 ${
            isHovered ? '-translate-y-2 scale-105' : ''
          } anim-brainstorm-float`}
        >
          <div className="w-6 h-1 bg-purple-300/40 rounded-xs mb-1" />
          <div className="w-10 h-0.5 bg-purple-300/20 rounded-xs" />
        </div>
        {/* Thought Bubble */}
        <div
          className="absolute bottom-6 left-8 w-8 h-8 rounded-full border border-emerald-400/30 bg-emerald-950/30 flex items-center justify-center anim-brainstorm-float"
          style={{ animationDelay: '3s' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-950/70 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>STUDIO CLUSTER</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400">
              IDEA CONSTELLATION
            </span>
          </div>

          {/* Connected Ideas Badge */}
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-950/50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 backdrop-blur-sm">
            <Lightbulb className="h-3 w-3 text-emerald-400" />
            <span>14 IDEAS LINKED</span>
          </div>
        </div>

        {/* Center Poll Visualization: Creative Idea Clusters */}
        <div className="space-y-2 rounded-lg border border-purple-500/20 bg-black/60 p-3 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-200 truncate pr-2">
              Emergent UX Concept Cluster
            </span>
            <span className="font-mono text-[9px] font-bold text-purple-400 uppercase tracking-wider shrink-0">
              ✦ CLUSTER MAP
            </span>
          </div>

          {/* Cluster #1 (Mint / Lavender) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="font-medium text-white">Orbital Nodes & Living Canvas</span>
              </div>
              <span className="font-mono font-bold text-emerald-300">46%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400 transition-all duration-500"
                style={{
                  width: isHovered ? '50%' : '46%',
                  boxShadow: '0 0 10px rgba(52, 211, 153, 0.5)',
                }}
              />
            </div>
          </div>

          {/* Cluster #2 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                <span className="font-medium text-zinc-300">Spatial Glassmorphic Notes</span>
              </div>
              <span className="font-mono font-bold text-purple-300">34%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500/80 transition-all duration-500"
                style={{ width: isHovered ? '32%' : '34%' }}
              />
            </div>
          </div>

          {/* Cluster #3 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <span className="font-medium text-zinc-400">Tactile Monospaced Precision</span>
              </div>
              <span className="font-mono font-bold text-zinc-400">20%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500/60 transition-all duration-500"
                style={{ width: '20%' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Studio Footer */}
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
          <span className="text-purple-300/90 font-medium">✦ Organic thought clusters</span>
          <span className="text-zinc-400">Mind-map vector links</span>
        </div>
      </div>
    </div>
  );
};

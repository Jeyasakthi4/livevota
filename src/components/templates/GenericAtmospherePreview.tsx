import React from 'react';
import { GraduationCap, Briefcase, Radio } from 'lucide-react';
import { EventPersonalityType } from '../../types';

interface GenericAtmospherePreviewProps {
  personality: EventPersonalityType;
  isHovered: boolean;
}

export const GenericAtmospherePreview: React.FC<GenericAtmospherePreviewProps> = ({
  personality,
  isHovered,
}) => {
  if (personality === 'classroom') {
    return (
      <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-xl bg-[#061221] select-none border border-sky-500/20">
        {/* Soft Academic Ambient Light */}
        <div
          className={`pointer-events-none absolute -top-12 left-1/3 w-60 h-60 rounded-full blur-2xl transition-all duration-700 ${
            isHovered
              ? 'opacity-80 bg-[radial-gradient(circle,rgba(56,189,248,0.45)_0%,rgba(14,165,233,0.15)_50%,transparent_75%)]'
              : 'opacity-50 bg-[radial-gradient(circle,rgba(56,189,248,0.25)_0%,rgba(14,165,233,0.1)_50%,transparent_75%)]'
          }`}
        />

        {/* Notebook Ruled Lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0px, transparent 23px, rgba(56, 189, 248, 0.4) 23px, rgba(56, 189, 248, 0.4) 24px)',
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-950/70 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>LECTURE HALL</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-sky-200">
              <GraduationCap className="h-3 w-3 text-sky-400" />
              <span>ACADEMIC</span>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-sky-500/20 bg-black/60 p-3 backdrop-blur-md">
            <div className="text-[11px] font-semibold text-zinc-200 truncate">
              Distributed Consensus (Raft vs Paxos)
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-white">Raft Leader Election</span>
                <span className="font-mono font-bold text-sky-300">68%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-500"
                  style={{ width: isHovered ? '72%' : '68%' }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">Paxos Multi-State Machine</span>
                <span className="font-mono font-bold text-zinc-400">32%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-800 transition-all duration-500"
                  style={{ width: isHovered ? '28%' : '32%' }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[9px] font-mono text-zinc-400">
            <span>✦ Calm academic environment</span>
            <span>Comprehension gauge</span>
          </div>
        </div>
      </div>
    );
  }

  if (personality === 'team-work') {
    return (
      <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-xl bg-[#090b14] select-none border border-zinc-700/50">
        {/* Subtle Architectural Laser Scanner Beam */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-zinc-400/60 to-transparent anim-work-scanner" />

        {/* Minimal Blueprint Dot Matrix */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-15"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="work-preview-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#a1a1aa" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#work-preview-dots)" />
        </svg>

        <div className="relative z-10 flex h-full flex-col justify-between p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-zinc-600 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              <span>SPRINT RETRO</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-300">
              <Briefcase className="h-3 w-3 text-zinc-400" />
              <span>EXECUTIVE</span>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-zinc-700/50 bg-black/60 p-3 backdrop-blur-md">
            <div className="text-[11px] font-semibold text-zinc-200 truncate">
              Engineering Focus: Pipeline CI Bottlenecks
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-white">CI / Automated Test Flakiness</span>
                <span className="font-mono font-bold text-zinc-200">58%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-300 transition-all duration-500"
                  style={{ width: isHovered ? '62%' : '58%' }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">Database Connection Pooling</span>
                <span className="font-mono font-bold text-zinc-400">42%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-600 transition-all duration-500"
                  style={{ width: isHovered ? '38%' : '42%' }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[9px] font-mono text-zinc-400">
            <span>✦ Precision structural layout</span>
            <span>Laser scan guide</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: live-event
  return (
    <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-xl bg-[#0f0418] select-none border border-fuchsia-500/20">
      <div
        className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-2xl transition-all duration-500 ${
          isHovered
            ? 'opacity-85 scale-110 bg-[radial-gradient(circle,rgba(217,70,239,0.55)_0%,rgba(168,85,247,0.3)_50%,transparent_75%)]'
            : 'opacity-55 scale-100 bg-[radial-gradient(circle,rgba(217,70,239,0.35)_0%,rgba(168,85,247,0.18)_50%,transparent_75%)]'
        }`}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 rounded-md border border-fuchsia-500/40 bg-fuchsia-950/70 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-fuchsia-300">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-ping" />
            <span>SOUNDSTAGE LIVE</span>
          </span>
          <div className="flex items-center gap-1 text-[10px] font-mono text-fuchsia-200">
            <Radio className="h-3 w-3 text-fuchsia-400" />
            <span>DECIBEL PULSE</span>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-fuchsia-500/25 bg-black/60 p-3 backdrop-blur-md">
          <div className="text-[11px] font-semibold text-zinc-200 truncate">
            Headliner Set: Neon Cyberpunk Synthwave
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-white">Neon Cyberpunk Anthem</span>
              <span className="font-mono font-bold text-fuchsia-300">71%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-all duration-500"
                style={{ width: isHovered ? '75%' : '71%' }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between text-[9px] font-mono text-zinc-400">
          <span>✦ Dynamic concert beams</span>
          <span>Crowd decibel surges</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Trophy } from 'lucide-react';

interface CompetitionAtmospherePreviewProps {
  isHovered: boolean;
}

export const CompetitionAtmospherePreview: React.FC<CompetitionAtmospherePreviewProps> = ({
  isHovered,
}) => {
  return (
    <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-xl bg-[#0c0406] select-none border border-red-500/25">
      {/* Stadium Floodlights (Left & Right Volumetric Beams) */}
      <div
        className={`pointer-events-none absolute -top-16 -left-12 w-64 h-64 rounded-full blur-2xl transition-all duration-500 ${
          isHovered
            ? 'opacity-85 scale-110 bg-[radial-gradient(circle,rgba(239,68,68,0.6)_0%,rgba(249,115,22,0.3)_45%,transparent_75%)]'
            : 'opacity-60 scale-100 bg-[radial-gradient(circle,rgba(239,68,68,0.4)_0%,rgba(220,38,38,0.15)_45%,transparent_75%)]'
        }`}
      />
      <div
        className={`pointer-events-none absolute -top-16 -right-12 w-64 h-64 rounded-full blur-2xl transition-all duration-500 ${
          isHovered
            ? 'opacity-80 scale-110 bg-[radial-gradient(circle,rgba(249,115,22,0.55)_0%,rgba(239,68,68,0.25)_45%,transparent_75%)]'
            : 'opacity-55 scale-100 bg-[radial-gradient(circle,rgba(249,115,22,0.35)_0%,rgba(217,119,6,0.15)_45%,transparent_75%)]'
        }`}
      />

      {/* 45° Diagonal Racing Chevrons & Speed Streaks */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-20 ${
          isHovered ? 'anim-streak-fast' : 'anim-competition-stripes'
        }`}
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.22) 0px, rgba(239, 68, 68, 0.22) 2px, transparent 2px, transparent 20px)',
        }}
      />

      {/* Stadium Arena Red Floor Horizon Glow */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-20 opacity-30"
        style={{
          background: 'linear-gradient(to top, rgba(239, 68, 68, 0.35) 0%, transparent 100%)',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-950/70 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-red-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
              <span>STADIUM ARENA</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400">
              CHAMPIONSHIP FINALS
            </span>
          </div>

          {/* Live Scoreboard Momentum Ticker */}
          <div className="flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-950/60 px-2 py-0.5 text-[10px] font-mono font-bold text-red-200 backdrop-blur-sm">
            <Trophy className="h-3 w-3 text-amber-400" />
            <span>+184 vpm SCOREBOARD</span>
          </div>
        </div>

        {/* Center Poll Visualization: Live Scoreboard Podium Hierarchy */}
        <div className="space-y-2 rounded-lg border border-red-500/25 bg-black/65 p-3 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-200 truncate pr-2">
              Championship Final: Rank #1 Live Standings
            </span>
            <span className="font-mono text-[9px] font-bold text-red-400 uppercase tracking-wider shrink-0">
              🏆 PODIUM RACE
            </span>
          </div>

          {/* 1st Place Podium Leader (Gold / Vermilion) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="flex h-3.5 px-1.5 items-center justify-center rounded bg-amber-400 font-mono text-[9px] font-black text-black shadow-sm">
                  🥇 1ST
                </span>
                <span className="font-bold text-white tracking-wide">Team Apex (Mesh Core)</span>
              </div>
              <span className="font-mono font-black text-amber-300">54%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all duration-500"
                style={{
                  width: isHovered ? '58%' : '54%',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.7)',
                }}
              />
            </div>
          </div>

          {/* 2nd Place Runner-up (Silver) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="flex h-3.5 px-1.5 items-center justify-center rounded bg-zinc-300 font-mono text-[9px] font-black text-black">
                  🥈 2ND
                </span>
                <span className="font-medium text-zinc-300">Team Neural (Code Reviewer)</span>
              </div>
              <span className="font-mono font-bold text-zinc-300">31%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-zinc-400 transition-all duration-500"
                style={{ width: isHovered ? '29%' : '31%' }}
              />
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="flex h-3.5 px-1.5 items-center justify-center rounded bg-amber-700/80 font-mono text-[9px] font-bold text-amber-100">
                  🥉 3RD
                </span>
                <span className="font-medium text-zinc-400">Team Vault (ZK Protocol)</span>
              </div>
              <span className="font-mono font-bold text-zinc-400">15%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-800/60 transition-all duration-500"
                style={{ width: '15%' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Scoreboard Telemetry Footer */}
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
          <span className="text-red-400/90 font-medium">⚡ Real-time podium shift</span>
          <span className="text-zinc-400">Stadium floodlight atmosphere</span>
        </div>
      </div>
    </div>
  );
};

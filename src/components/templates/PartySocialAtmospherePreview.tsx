import React from 'react';
import { PartyPopper } from 'lucide-react';

interface PartySocialAtmospherePreviewProps {
  isHovered: boolean;
}

export const PartySocialAtmospherePreview: React.FC<PartySocialAtmospherePreviewProps> = ({
  isHovered,
}) => {
  return (
    <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-xl bg-[#120311] select-none border border-rose-500/25">
      {/* Velvet Champagne Ambient Washes */}
      <div
        className={`pointer-events-none absolute -top-16 left-1/3 w-64 h-64 rounded-full blur-2xl transition-all duration-700 ${
          isHovered
            ? 'opacity-85 scale-110 bg-[radial-gradient(circle,rgba(244,63,94,0.55)_0%,rgba(251,191,36,0.3)_45%,transparent_75%)]'
            : 'opacity-55 scale-100 bg-[radial-gradient(circle,rgba(244,63,94,0.38)_0%,rgba(251,191,36,0.18)_45%,transparent_75%)]'
        }`}
      />
      <div
        className={`pointer-events-none absolute bottom-0 right-1/4 w-56 h-56 rounded-full blur-2xl transition-all duration-700 ${
          isHovered
            ? 'opacity-75 scale-110 bg-[radial-gradient(circle,rgba(217,70,239,0.5)_0%,rgba(244,63,94,0.2)_50%,transparent_75%)]'
            : 'opacity-45 scale-100 bg-[radial-gradient(circle,rgba(217,70,239,0.3)_0%,rgba(244,63,94,0.12)_50%,transparent_75%)]'
        }`}
      />

      {/* Soft Glowing Layered Bokeh Discs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-6 left-10 w-16 h-16 rounded-full bg-rose-500/20 blur-md transition-transform duration-700 ${
            isHovered ? 'scale-125 opacity-70' : ''
          } anim-bokeh-gentle`}
          style={{ animationDuration: '8s' }}
        />
        <div
          className={`absolute top-1/2 right-12 w-20 h-20 rounded-full bg-amber-400/20 blur-lg transition-transform duration-700 ${
            isHovered ? 'scale-120 opacity-70' : ''
          } anim-bokeh-gentle`}
          style={{ animationDelay: '2.5s', animationDuration: '9s' }}
        />
        <div
          className="absolute bottom-4 left-1/3 w-14 h-14 rounded-full bg-fuchsia-500/15 blur-md anim-bokeh-gentle"
          style={{ animationDelay: '4.5s', animationDuration: '7s' }}
        />
      </div>

      {/* Elegant Drifting Champagne & Metallic Confetti Flakes (No childish balloons!) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-2 left-[18%] w-2 h-1.5 rounded-xs bg-amber-300/60 anim-confetti-flutter"
          style={{ animationDelay: '0s', animationDuration: '6s' }}
        />
        <div
          className="absolute top-4 left-[45%] w-1.5 h-2 rounded-xs bg-rose-300/50 anim-confetti-flutter"
          style={{ animationDelay: '2s', animationDuration: '7s' }}
        />
        <div
          className="absolute top-1 right-[24%] w-2.5 h-1.5 rounded-xs bg-yellow-200/65 anim-confetti-flutter"
          style={{ animationDelay: '1.2s', animationDuration: '5.5s' }}
        />
        <div
          className="absolute top-3 right-[10%] w-1.5 h-2.5 rounded-xs bg-fuchsia-300/50 anim-confetti-flutter"
          style={{ animationDelay: '3.5s', animationDuration: '6.5s' }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-950/70 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>GALA VIBE</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400">
              MILESTONE CELEBRATION
            </span>
          </div>

          {/* Crowd Cheers Pulse */}
          <div className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-950/50 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-200 backdrop-blur-sm">
            <PartyPopper className="h-3 w-3 text-amber-400" />
            <span>🥂 1.4K TOASTS</span>
          </div>
        </div>

        {/* Center Poll Visualization: Milestone Celebrations */}
        <div className="space-y-2 rounded-lg border border-rose-500/25 bg-black/60 p-3 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-200 truncate pr-2">
              Team Milestone Gala: Top Achievement
            </span>
            <span className="font-mono text-[9px] font-bold text-rose-400 uppercase tracking-wider shrink-0">
              🍾 CHEERS ACTIVE
            </span>
          </div>

          {/* Milestone 1 (Champagne Rose Leader) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🥂</span>
                <span className="font-bold text-white">Zero-Downtime V1.0 Multi-Region</span>
              </div>
              <span className="font-mono font-bold text-amber-300">62%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-400 to-amber-300 transition-all duration-500"
                style={{
                  width: isHovered ? '66%' : '62%',
                  boxShadow: '0 0 10px rgba(244, 63, 94, 0.6)',
                }}
              />
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🎸</span>
                <span className="font-medium text-zinc-300">Legendary 3-Day Retreat</span>
              </div>
              <span className="font-mono font-bold text-zinc-300">24%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-500/70 transition-all duration-500"
                style={{ width: isHovered ? '22%' : '24%' }}
              />
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">⚡</span>
                <span className="font-medium text-zinc-400">10,000,000 Audience Pulses</span>
              </div>
              <span className="font-mono font-bold text-zinc-400">14%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500/60 transition-all duration-500"
                style={{ width: '14%' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Gala Footer */}
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
          <span className="text-rose-300/90 font-medium">🥂 Champagne confetti & bokeh</span>
          <span className="text-zinc-400">Festive milestone energy</span>
        </div>
      </div>
    </div>
  );
};

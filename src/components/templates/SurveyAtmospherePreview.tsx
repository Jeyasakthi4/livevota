import React from 'react';
import { BarChart3 } from 'lucide-react';

interface SurveyAtmospherePreviewProps {
  isHovered: boolean;
}

export const SurveyAtmospherePreview: React.FC<SurveyAtmospherePreviewProps> = ({ isHovered }) => {
  return (
    <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-xl bg-[#031017] select-none border border-cyan-500/25">
      {/* Precision Cartesian Grid Background */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="survey-preview-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="rgba(6, 182, 212, 0.4)"
              strokeWidth="0.5"
            />
            <circle cx="0" cy="0" r="1" fill="rgba(45, 212, 191, 0.6)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#survey-preview-grid)" />
      </svg>

      {/* Subtle Oscilloscope Waveform Scanning Line */}
      <svg
        className="pointer-events-none absolute bottom-3 inset-x-0 h-10 w-full opacity-45"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 0 20 Q 50 5 100 20 T 200 20 T 300 10 T 400 25 T 500 20"
          fill="none"
          stroke={isHovered ? '#22d3ee' : '#06b6d4'}
          strokeWidth="1.25"
          className="anim-oscilloscope-flow"
        />
      </svg>

      {/* Crosshair Coordinates in Corners */}
      <div className="pointer-events-none absolute top-3 right-3 text-[9px] font-mono text-cyan-400/40">
        + [CI: 95%]
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 text-[9px] font-mono text-cyan-400/40">
        xy:0.842
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-950/70 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>EMPIRICAL MATRIX</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400">
              QUANTITATIVE STUDY
            </span>
          </div>

          {/* Sample Size Telemetry */}
          <div className="flex items-center gap-1.5 rounded-md border border-cyan-500/30 bg-cyan-950/50 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 backdrop-blur-sm">
            <BarChart3 className="h-3 w-3 text-cyan-400" />
            <span>N = 2,840 COHORT</span>
          </div>
        </div>

        {/* Center Poll Visualization: Quantitative Empirical Telemetry */}
        <div className="space-y-2 rounded-lg border border-cyan-500/20 bg-black/60 p-3 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-200 truncate pr-2">
              High-Throughput API Standard Runtime
            </span>
            <span className="font-mono text-[9px] font-bold text-cyan-400 uppercase tracking-wider shrink-0">
              CI ±1.2%
            </span>
          </div>

          {/* Option 1: Go Goroutines */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400 font-bold">01.</span>
                <span className="font-medium text-white">Go (Gin / Fiber Goroutines)</span>
              </div>
              <span className="font-bold text-cyan-300">48.2%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500"
                style={{
                  width: isHovered ? '51%' : '48.2%',
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.6)',
                }}
              />
            </div>
          </div>

          {/* Option 2: Node.js / TS */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">02.</span>
                <span className="font-medium text-zinc-300">Node.js / TS (Fastify)</span>
              </div>
              <span className="font-medium text-zinc-300">32.6%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-600/70 transition-all duration-500"
                style={{ width: isHovered ? '30%' : '32.6%' }}
              />
            </div>
          </div>

          {/* Option 3: Rust */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">03.</span>
                <span className="font-medium text-zinc-400">Rust (Axum / Tokio Core)</span>
              </div>
              <span className="font-medium text-zinc-400">19.2%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-800/60 transition-all duration-500"
                style={{ width: '19.2%' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Telemetry Footer */}
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
          <span className="text-cyan-400/90 font-medium">✦ Cartesian coordinate telemetry</span>
          <span className="text-zinc-400">Oscilloscope waveform precision</span>
        </div>
      </div>
    </div>
  );
};

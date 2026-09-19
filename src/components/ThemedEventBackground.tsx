import React from 'react';
import { EventPersonalityType } from '../types';
import { PulseTheme } from '../utils/themeManager';

interface ThemedEventBackgroundProps {
  personality?: EventPersonalityType | string;
  theme?: PulseTheme;
  variant?: 'fullscreen' | 'card' | 'inset';
  className?: string;
  opacity?: number;
}

export const ThemedEventBackground: React.FC<ThemedEventBackgroundProps> = ({
  personality = 'conference',
  theme,
  variant = 'fullscreen',
  className = '',
  opacity = 1,
}) => {
  const p = (theme?.personality || personality || 'conference') as EventPersonalityType;

  // Render bespoke, high-craft SVG patterns, textures and animations for each event personality
  const renderAtmosphere = () => {
    switch (p) {
      // -----------------------------------------------------------------------
      // 1. CLASSROOM — soft academic environment, subtle notebook/grid texture, calm blue tones
      // -----------------------------------------------------------------------
      case 'classroom':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Subtle Academic Notebook Ruled Lines & Graph Grid */}
            <svg
              className="absolute inset-0 h-full w-full opacity-35"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Horizontal notebook lines with subtle vertical grid intersections */}
                <pattern id="classroom-notebook-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path
                    d="M 32 0 L 0 0 0 32"
                    fill="none"
                    stroke="rgba(96, 165, 250, 0.08)"
                    strokeWidth="0.75"
                  />
                  {/* Notebook horizontal ruled line emphasis */}
                  <line
                    x1="0"
                    y1="32"
                    x2="32"
                    y2="32"
                    stroke="rgba(147, 197, 253, 0.12)"
                    strokeWidth="1"
                  />
                </pattern>
                {/* Notebook vertical left margin guide line */}
                <pattern id="classroom-margin-guide" width="160" height="160" patternUnits="userSpaceOnUse">
                  <rect width="160" height="160" fill="url(#classroom-notebook-grid)" />
                  <line
                    x1="48"
                    y1="0"
                    x2="48"
                    y2="160"
                    stroke="rgba(129, 140, 248, 0.18)"
                    strokeWidth="1.25"
                    strokeDasharray="4 2"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#classroom-margin-guide)" />
            </svg>

            {/* Geometric compass blueprint arc in corner */}
            <svg
              className="absolute -bottom-24 -right-24 w-96 h-96 opacity-15 text-blue-400"
              viewBox="0 0 200 200"
              fill="none"
            >
              <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="65" stroke="currentColor" strokeWidth="0.75" />
              <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 4" />
              <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="0.75" />
              <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.75" />
            </svg>

            {/* Soft Lecture Hall Ambient Downlight */}
            <div
              className="absolute -top-36 left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full blur-3xl opacity-35"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.3) 0%, rgba(30, 58, 138, 0.15) 55%, transparent 75%)',
              }}
            />

            {/* Subtle Floating Academic Dust / Chalk Motes (Reduced-Motion Friendly) */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full bg-blue-300/40 blur-[0.5px] anim-classroom-dust"
                style={{ animationDelay: '0s' }}
              />
              <div
                className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-sky-200/35 blur-[0.5px] anim-classroom-dust"
                style={{ animationDelay: '3s' }}
              />
              <div
                className="absolute top-2/3 left-1/3 w-1.5 h-1.5 rounded-full bg-indigo-300/30 blur-[0.5px] anim-classroom-dust"
                style={{ animationDelay: '6s' }}
              />
              <div
                className="absolute top-1/2 right-1/6 w-2 h-2 rounded-full bg-cyan-200/30 blur-[0.5px] anim-classroom-dust"
                style={{ animationDelay: '9s' }}
              />
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 2. TEAM / WORK — sophisticated office-inspired, geometric architecture, dark professional tones
      // -----------------------------------------------------------------------
      case 'team-work':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Geometric Office Architectural Grid & Structural Columns */}
            <svg
              className="absolute inset-0 h-full w-full opacity-30"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Structural mullion matrix */}
                <pattern id="work-architectural-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="48" y2="0" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="0.75" />
                  <line x1="0" y1="0" x2="0" y2="48" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="0.75" />
                  {/* Architectural intersection tick */}
                  <path d="M 22 24 L 26 24 M 24 22 L 24 26" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="0.75" />
                </pattern>
                {/* Major structural column modules */}
                <pattern id="work-major-bays" width="192" height="192" patternUnits="userSpaceOnUse">
                  <rect width="192" height="192" fill="url(#work-architectural-grid)" />
                  <line x1="0" y1="0" x2="192" y2="0" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="1.25" />
                  <line x1="0" y1="0" x2="0" y2="192" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="1.25" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#work-major-bays)" />
            </svg>

            {/* Precision Laser Horizon Guide */}
            <div
              className="absolute top-0 inset-x-0 h-px pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.7) 50%, transparent 100%)',
              }}
            />

            {/* Subtle Scanning Coordinate Guide Line */}
            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/25 to-transparent anim-work-scanner">
              <div className="absolute left-1/4 -top-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 text-[9px] font-mono text-blue-400">
                <span>AXIS // 04.92</span>
              </div>
            </div>

            {/* Executive Dark Sapphire Ambient Center Beam */}
            <div
              className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[550px] rounded-full blur-3xl opacity-35"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.28) 0%, rgba(15, 23, 42, 0.4) 60%, transparent 80%)',
              }}
            />
          </div>
        );

      // -----------------------------------------------------------------------
      // 3. LIVE EVENT — energetic stage atmosphere, subtle spotlights, dynamic light beams, audience ambience
      // -----------------------------------------------------------------------
      case 'live-event':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Dynamic Stage Spotlight 1: Left Sweeping Volumetric Beam */}
            <div
              className="absolute -top-24 -left-20 w-[680px] h-[800px] blur-3xl opacity-45 anim-stage-beam-left"
              style={{
                background:
                  'conic-gradient(from 135deg at 20% 0%, rgba(236, 72, 153, 0.45) 0deg, rgba(168, 85, 247, 0.2) 40deg, transparent 75deg)',
              }}
            />

            {/* Dynamic Stage Spotlight 2: Right Sweeping Volumetric Beam */}
            <div
              className="absolute -top-24 -right-20 w-[680px] h-[800px] blur-3xl opacity-40 anim-stage-beam-right"
              style={{
                background:
                  'conic-gradient(from 225deg at 80% 0%, rgba(6, 182, 212, 0.4) 0deg, rgba(139, 92, 246, 0.2) 40deg, transparent 75deg)',
              }}
            />

            {/* Stage Center Floor Backlight Bar */}
            <div
              className="absolute -top-28 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-3xl opacity-35"
              style={{
                background:
                  'radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 75%)',
              }}
            />

            {/* Stadium Jumbotron Soundwave Ripples & Stage Geometry */}
            <svg
              className="absolute inset-0 h-full w-full opacity-25"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="live-stage-rings" cx="50%" cy="100%" r="90%">
                  <stop offset="15%" stopColor="transparent" />
                  <stop offset="30%" stopColor="rgba(236, 72, 153, 0.25)" />
                  <stop offset="42%" stopColor="transparent" />
                  <stop offset="55%" stopColor="rgba(6, 182, 212, 0.2)" />
                  <stop offset="68%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#live-stage-rings)" />
            </svg>

            {/* Subtle Audience Horizon Ambience Silhouette at Bottom */}
            <div
              className="absolute bottom-0 inset-x-0 h-40 opacity-40"
              style={{
                background:
                  'linear-gradient(to top, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.05) 50%, transparent 100%)',
              }}
            />
          </div>
        );

      // -----------------------------------------------------------------------
      // 4. QUIZ — playful knowledge-game atmosphere, subtle question marks, floating symbols, interactive competition feel
      // -----------------------------------------------------------------------
      case 'quiz':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Arena Trivia Diamond Pattern Grid */}
            <svg
              className="absolute inset-0 h-full w-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="quiz-diamonds-grid" width="44" height="44" patternUnits="userSpaceOnUse">
                  <path
                    d="M 22 0 L 44 22 L 22 44 L 0 22 Z"
                    fill="none"
                    stroke="rgba(245, 158, 11, 0.16)"
                    strokeWidth="0.8"
                  />
                  <circle cx="22" cy="22" r="1.5" fill="rgba(168, 85, 247, 0.3)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#quiz-diamonds-grid)" />
            </svg>

            {/* Gameshow Buzzer Arena Overhead Spotlight */}
            <div
              className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[550px] rounded-full blur-3xl opacity-40"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.35) 0%, rgba(124, 58, 237, 0.22) 55%, transparent 80%)',
              }}
            />

            {/* Subtle Floating Knowledge Symbols (Question Marks, Exclamations, Sparks) */}
            <div className="absolute inset-0 overflow-hidden select-none">
              <span
                className="absolute bottom-12 left-[12%] text-2xl font-mono font-black text-amber-400/30 anim-quiz-symbol"
                style={{ animationDelay: '0s', animationDuration: '11s' }}
              >
                ?
              </span>
              <span
                className="absolute bottom-20 left-[28%] text-xl font-mono font-bold text-purple-400/25 anim-quiz-symbol"
                style={{ animationDelay: '3.5s', animationDuration: '13s' }}
              >
                ✦
              </span>
              <span
                className="absolute bottom-16 right-[30%] text-2xl font-mono font-black text-amber-300/30 anim-quiz-symbol"
                style={{ animationDelay: '6s', animationDuration: '10s' }}
              >
                !
              </span>
              <span
                className="absolute bottom-28 right-[15%] text-xl font-mono font-bold text-violet-400/25 anim-quiz-symbol"
                style={{ animationDelay: '2s', animationDuration: '12s' }}
              >
                ?
              </span>
              <span
                className="absolute bottom-8 left-[45%] text-lg font-mono font-semibold text-amber-400/20 anim-quiz-symbol"
                style={{ animationDelay: '8s', animationDuration: '14s' }}
              >
                ◇
              </span>
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 5. COMPETITION — bold stadium/arena-inspired, dramatic lighting, dynamic motion accents
      // -----------------------------------------------------------------------
      case 'competition':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Dramatic Twin Stadium Floodlight Beams */}
            <div
              className="absolute -top-32 left-1/4 w-[650px] h-[580px] rounded-full blur-3xl opacity-35 anim-competition-beam"
              style={{
                background:
                  'radial-gradient(circle, rgba(239, 68, 68, 0.38) 0%, rgba(220, 38, 38, 0.15) 50%, transparent 75%)',
              }}
            />
            <div
              className="absolute -top-32 right-1/4 w-[650px] h-[580px] rounded-full blur-3xl opacity-30 anim-competition-beam"
              style={{
                animationDelay: '4s',
                background:
                  'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.12) 50%, transparent 75%)',
              }}
            />

            {/* Stadium Arena Racing Stripes (45-degree angled chevron motion) */}
            <div
              className="absolute inset-0 opacity-15 anim-competition-stripes"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.18) 0px, rgba(239, 68, 68, 0.18) 2px, transparent 2px, transparent 28px)',
              }}
            />

            {/* Stadium Track Geometry Lines */}
            <svg
              className="absolute inset-0 h-full w-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="0" y1="35%" x2="100%" y2="35%" stroke="rgba(239, 68, 68, 0.25)" strokeWidth="1" strokeDasharray="12 8" />
              <line x1="0" y1="65%" x2="100%" y2="65%" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="1" strokeDasharray="12 8" />
            </svg>

            {/* High-Tension Red Horizon Floor Glow */}
            <div
              className="absolute bottom-0 inset-x-0 h-44 opacity-25"
              style={{
                background:
                  'linear-gradient(to top, rgba(239, 68, 68, 0.25) 0%, transparent 100%)',
              }}
            />
          </div>
        );

      // -----------------------------------------------------------------------
      // 6. BRAINSTORM — creative workspace, subtle floating ideas, sketches, connecting lines and thought bubbles
      // -----------------------------------------------------------------------
      case 'brainstorm':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Creative Lavender & Mint Studio Aurora Glow */}
            <div
              className="absolute -top-32 left-1/4 w-[680px] h-[600px] rounded-full blur-3xl opacity-35"
              style={{
                background:
                  'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(99, 102, 241, 0.18) 55%, transparent 80%)',
              }}
            />
            <div
              className="absolute top-1/3 right-12 w-[520px] h-[520px] rounded-full blur-3xl opacity-25"
              style={{
                background:
                  'radial-gradient(circle, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.12) 50%, transparent 75%)',
              }}
            />

            {/* Mind-Map Connecting Lines & Ideation Constellation Vectors */}
            <svg
              className="absolute inset-0 h-full w-full opacity-25"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Flowing animated idea vectors */}
              <path
                d="M 120 180 Q 280 120 480 220 T 840 160 T 1140 240"
                fill="none"
                stroke="rgba(192, 132, 252, 0.35)"
                strokeWidth="1.5"
                className="anim-brainstorm-dash"
              />
              <path
                d="M 180 340 Q 360 420 620 310 T 960 380"
                fill="none"
                stroke="rgba(52, 211, 153, 0.3)"
                strokeWidth="1.25"
                className="anim-brainstorm-dash"
              />
              {/* Ideation nodes */}
              <circle cx="120" cy="180" r="3" fill="#c084fc" />
              <circle cx="480" cy="220" r="3" fill="#34d399" />
              <circle cx="840" cy="160" r="3.5" fill="#c084fc" />
              <circle cx="620" cy="310" r="3" fill="#818cf8" />
            </svg>

            {/* Subtle Floating Thought Bubbles & Wireframe Sketch Notes */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Wireframe Idea Card 1 */}
              <div
                className="absolute top-1/4 left-[14%] w-16 h-12 rounded-lg border border-purple-400/20 bg-purple-950/20 p-1.5 anim-brainstorm-float"
                style={{ animationDelay: '0s' }}
              >
                <div className="w-8 h-1 bg-purple-400/30 rounded mb-1" />
                <div className="w-12 h-1 bg-purple-400/15 rounded" />
              </div>

              {/* Thought Bubble 1 */}
              <div
                className="absolute top-1/3 right-[18%] w-14 h-14 rounded-full border border-emerald-400/20 bg-emerald-950/15 flex items-center justify-center anim-brainstorm-float"
                style={{ animationDelay: '3s' }}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400/30" />
              </div>

              {/* Wireframe Idea Card 2 */}
              <div
                className="absolute bottom-1/4 left-[32%] w-14 h-10 rounded-lg border border-indigo-400/20 bg-indigo-950/20 p-1.5 anim-brainstorm-float"
                style={{ animationDelay: '5s' }}
              >
                <div className="w-6 h-1 bg-indigo-400/30 rounded mb-1" />
                <div className="w-10 h-1 bg-indigo-400/15 rounded" />
              </div>
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 7. PARTY / SOCIAL — celebratory atmosphere with elegant confetti, soft bokeh and dynamic festive lighting
      // -----------------------------------------------------------------------
      case 'party-social':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Velvet Midnight Champagne Rose Bokeh Glows */}
            <div
              className="absolute -top-24 left-1/3 w-[700px] h-[550px] rounded-full blur-3xl opacity-40"
              style={{
                background:
                  'radial-gradient(circle, rgba(244, 63, 94, 0.35) 0%, rgba(251, 191, 36, 0.2) 50%, transparent 75%)',
              }}
            />
            <div
              className="absolute bottom-12 right-1/4 w-[550px] h-[550px] rounded-full blur-3xl opacity-30"
              style={{
                background:
                  'radial-gradient(circle, rgba(217, 70, 239, 0.3) 0%, transparent 70%)',
              }}
            />

            {/* Soft Layered Bokeh Light Discs */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute top-1/5 left-[18%] w-24 h-24 rounded-full bg-rose-500/15 blur-xl anim-party-bokeh"
                style={{ animationDelay: '0s' }}
              />
              <div
                className="absolute top-2/5 right-[22%] w-32 h-32 rounded-full bg-amber-400/15 blur-2xl anim-party-bokeh"
                style={{ animationDelay: '2.5s' }}
              />
              <div
                className="absolute bottom-1/3 left-[35%] w-20 h-20 rounded-full bg-fuchsia-500/15 blur-lg anim-party-bokeh"
                style={{ animationDelay: '5s' }}
              />
            </div>

            {/* Elegant Drifting Metallic & Champagne Confetti Flakes */}
            <div className="absolute inset-0 overflow-hidden select-none">
              <div
                className="absolute top-6 left-[10%] w-2.5 h-1.5 rounded-xs bg-amber-300/45 anim-party-confetti"
                style={{ animationDelay: '0s', animationDuration: '10s' }}
              />
              <div
                className="absolute top-12 left-[25%] w-2 h-2 rounded-xs bg-rose-400/40 anim-party-confetti"
                style={{ animationDelay: '2.5s', animationDuration: '12s' }}
              />
              <div
                className="absolute top-4 left-[42%] w-1.5 h-3 rounded-xs bg-fuchsia-300/40 anim-party-confetti"
                style={{ animationDelay: '5s', animationDuration: '11s' }}
              />
              <div
                className="absolute top-8 right-[30%] w-2.5 h-2 rounded-xs bg-amber-200/50 anim-party-confetti"
                style={{ animationDelay: '1.5s', animationDuration: '13s' }}
              />
              <div
                className="absolute top-16 right-[15%] w-2 h-1.5 rounded-xs bg-rose-300/45 anim-party-confetti"
                style={{ animationDelay: '4s', animationDuration: '9.5s' }}
              />
              <div
                className="absolute top-10 right-[45%] w-1.5 h-2 rounded-xs bg-yellow-200/40 anim-party-confetti"
                style={{ animationDelay: '7s', animationDuration: '11.5s' }}
              />
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 8. SURVEY — clean research/data atmosphere with subtle grids, dots and analytical patterns
      // -----------------------------------------------------------------------
      case 'survey':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Precision Cartesian Coordinate Analytical Grid */}
            <svg
              className="absolute inset-0 h-full w-full opacity-30"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="survey-analytical-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <path
                    d="M 28 0 L 0 0 0 28"
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.1)"
                    strokeWidth="0.75"
                  />
                  {/* Axis coordinate dot */}
                  <circle cx="28" cy="28" r="0.8" fill="rgba(6, 182, 212, 0.3)" />
                </pattern>
                <pattern id="survey-major-blocks" width="140" height="140" patternUnits="userSpaceOnUse">
                  <rect width="140" height="140" fill="url(#survey-analytical-grid)" />
                  <line x1="0" y1="0" x2="140" y2="0" stroke="rgba(6, 182, 212, 0.22)" strokeWidth="1.25" />
                  <line x1="0" y1="0" x2="0" y2="140" stroke="rgba(6, 182, 212, 0.22)" strokeWidth="1.25" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#survey-major-blocks)" />
            </svg>

            {/* Oscilloscope Scanning Waveform Vector Line */}
            <svg
              className="absolute bottom-20 inset-x-0 w-full h-24 opacity-25"
              viewBox="0 0 1200 100"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M 0 50 Q 150 20 300 50 T 600 50 T 900 80 T 1200 50"
                stroke="rgba(6, 182, 212, 0.6)"
                strokeWidth="1.5"
                className="anim-survey-wave"
              />
            </svg>

            {/* Analytical Radar Center Ambient Sweep Beam */}
            <div
              className="absolute -top-36 left-1/2 -translate-x-1/2 w-[720px] h-[550px] rounded-full blur-3xl opacity-35"
              style={{
                background:
                  'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(14, 116, 144, 0.18) 55%, transparent 75%)',
              }}
            />

            {/* Corner Precision Metric Badges */}
            <div className="absolute top-20 right-8 text-[9px] font-mono text-cyan-400/40 space-y-1">
              <div>// METRIC_CI: 95.0%</div>
              <div>// RES_SAMPLE: N=14.8K</div>
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // 9. CONFERENCE — premium futuristic conference atmosphere with abstract stage geometry and sophisticated lighting
      // -----------------------------------------------------------------------
      case 'conference':
      default:
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Keynote Auditorium Convergence Horizon Beam */}
            <div
              className="absolute -top-40 left-1/2 -translate-x-1/2 w-[880px] h-[580px] rounded-full blur-3xl opacity-40 anim-conference-horizon"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(14, 165, 233, 0.4) 0%, rgba(99, 102, 241, 0.22) 50%, transparent 80%)',
              }}
            />

            {/* 3D Abstract Perspective Stage Floor Lines */}
            <svg
              className="absolute bottom-0 inset-x-0 w-full h-[45vh] opacity-25"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Converging stage floor rays */}
              <line x1="500" y1="0" x2="0" y2="400" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />
              <line x1="500" y1="0" x2="160" y2="400" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.8" />
              <line x1="500" y1="0" x2="340" y2="400" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />
              <line x1="500" y1="0" x2="500" y2="400" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1.25" />
              <line x1="500" y1="0" x2="660" y2="400" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />
              <line x1="500" y1="0" x2="840" y2="400" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.8" />
              <line x1="500" y1="0" x2="1000" y2="400" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />

              {/* Horizontal stage depth tiers */}
              <line x1="420" y1="50" x2="580" y2="50" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.75" />
              <line x1="320" y1="120" x2="680" y2="120" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="0.8" />
              <line x1="180" y1="220" x2="820" y2="220" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" />
              <line x1="0" y1="360" x2="1000" y2="360" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.2" />
            </svg>

            {/* Global Keynote Constellation Mesh in Upper Atmosphere */}
            <svg
              className="absolute top-0 inset-x-0 h-64 w-full opacity-18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="conf-keynote-mesh" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="8" cy="8" r="1.5" fill="rgba(56, 189, 248, 0.45)" />
                  <circle cx="38" cy="38" r="1.2" fill="rgba(129, 140, 248, 0.35)" />
                  <line x1="8" y1="8" x2="38" y2="38" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#conf-keynote-mesh)" />
            </svg>
          </div>
        );
    }
  };

  // Base canvas colors for each personality
  const getBaseBgClass = () => {
    switch (p) {
      case 'classroom':
        return 'bg-[#060D18]';
      case 'team-work':
        return 'bg-[#06080D]';
      case 'live-event':
        return 'bg-[#080210]';
      case 'quiz':
        return 'bg-[#0A0318]';
      case 'competition':
        return 'bg-[#0B0305]';
      case 'brainstorm':
        return 'bg-[#080517]';
      case 'party-social':
        return 'bg-[#0F020C]';
      case 'survey':
        return 'bg-[#020B10]';
      case 'conference':
      default:
        return 'bg-[#030616]';
    }
  };

  // Content contrast protection vignette
  const renderVignette = () => (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(7, 8, 11, 0.4) 60%, rgba(7, 8, 11, 0.82) 100%)',
      }}
    />
  );

  if (variant === 'card') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden rounded-2xl ${getBaseBgClass()} ${className}`}
        style={{ opacity }}
      >
        {renderAtmosphere()}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
    );
  }

  if (variant === 'inset') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${getBaseBgClass()} ${className}`}
        style={{ opacity }}
      >
        {renderAtmosphere()}
        <div className="pointer-events-none absolute inset-0 bg-black/40" />
      </div>
    );
  }

  // Fullscreen variant for page backgrounds
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-20 overflow-hidden ${getBaseBgClass()} transition-colors duration-700 ${className}`}
      style={{ opacity }}
    >
      {renderAtmosphere()}
      {renderVignette()}
    </div>
  );
};

import { EventPersonalityType } from '../types';

export interface ThemeColorOption {
  id: string;
  label: string;
  border: string;
  text: string;
  glow: string;
  bg: string;
  accent: string;
  barColor: string;
}

export interface ThemeAtmosphere {
  previewBg: string;              // Base background styling for live preview pane
  previewGradient: string;        // Ambient lighting glow overlay style
  presentationBg: string;         // Cinema/stage mode background
  patternClass: string;           // Personality atmospheric pattern descriptor
  overlayOpacity: number;
}

export interface ThemeAccentColors {
  primary: string;                // Primary signature hex
  secondary: string;              // Secondary accent hex
  glow: string;                   // Glow CSS string
  border: string;                 // Border CSS string
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export interface ThemeTypography {
  titleClass: string;             // Question title typography
  descriptionClass: string;       // Subtitle typography
  badgeClass: string;             // Tag/category badge
  labelClass: string;             // Option labels
  metricClass: string;            // Large percentage/number display
}

export interface ThemeSurface {
  cardRounded: string;            // Border radius
  cardBorder: string;             // Border styling
  cardBg: string;                 // Card background
  cardLeading: string;            // Leading card highlight
  cardSelected: string;           // User-selected card state
  surfaceShadow: string;          // Drop shadow
  divider: string;                // Divider line style
}

export interface ThemeAnimation {
  intensity: 'calm' | 'crisp' | 'energetic' | 'punchy' | 'explosive' | 'fluid' | 'bouncy' | 'clinical' | 'cinematic';
  pulseFrequencySeconds: number;  // Pulse loop / response duration
  pulseScalePeak: number;         // Peak node expansion scale
  pulseRhythm: 'rapid' | 'energetic' | 'standard' | 'relaxed' | 'deep';
  rippleSpeed: string;            // CSS wave speed
}

export interface ThemeVisualDetails {
  primaryIcon: string;            // Lucide icon name
  personalityBadge: string;       // Header badge (e.g., "CLASSROOM · CALM")
  statusIndicator: string;        // Status footer label
  specialWidget: 'countdown' | 'leaderboard' | 'metrics' | 'brainstorm' | 'celebration' | 'none';
  widgetLabel: string;
  widgetText: string;
  countdownSeconds?: number;
}

export interface ThemePresentation {
  stageBackdrop: string;
  headerBadge: string;
  titleSize: string;
  qrBadgeStyle: string;
  layoutArchetype: 'lecture' | 'boardroom' | 'arena' | 'gameshow' | 'tournament' | 'studio' | 'lounge' | 'briefing' | 'keynote';
}

export interface PulseTheme {
  id: string;
  name: string;
  personality: EventPersonalityType;
  personalityLabel: string;
  templateId?: string;
  templateName?: string;
  tagline: string;

  // The 8 explicit user dimensions
  atmosphere: ThemeAtmosphere;
  accentColors: ThemeAccentColors;
  typography: ThemeTypography;
  surface: ThemeSurface;
  animation: ThemeAnimation;
  visualDetails: ThemeVisualDetails;
  presentation: ThemePresentation;

  // Physical Node Size parameters
  nodeBaseSize: number;           // Base diameter in pixels
  nodeGrowthFactor: number;       // Max growth in pixels

  // Palette for options
  palette: ThemeColorOption[];
  leadPalette: {
    border: string;
    text: string;
    glow: string;
    bg: string;
    badgeBg: string;
    badgeBorder: string;
  };

  // CSS Variables
  cssVariables: Record<string, string>;

  // Backwards-compatible tailwindClasses
  tailwindClasses: {
    containerBorder: string;
    containerGlow: string;
    gridBg: string;
    cardBorder: string;
    cardBg: string;
    cardLeading: string;
    cardSelected: string;
    badge: string;
    progressBarBg: string;
    accentText: string;
  };
}

// ---------------------------------------------------------------------------
// 1. CLASSROOM — clean, educational, calm
// ---------------------------------------------------------------------------
export const THEME_CLASSROOM: PulseTheme = {
  id: 'theme-classroom',
  name: 'Classroom Calm',
  personality: 'classroom',
  personalityLabel: 'CLASSROOM',
  tagline: 'Clean, educational, calm atmosphere fostering comprehension',
  atmosphere: {
    previewBg: 'bg-[#091117]',
    previewGradient: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.12) 0%, rgba(9, 17, 23, 0.95) 75%)',
    presentationBg: 'bg-[#080E14]',
    patternClass: 'pattern-chalkboard',
    overlayOpacity: 0.4,
  },
  accentColors: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.22)',
    border: 'rgba(16, 185, 129, 0.35)',
    badgeBg: 'rgba(6, 78, 59, 0.45)',
    badgeBorder: 'rgba(16, 185, 129, 0.3)',
    badgeText: '#6ee7b7',
  },
  typography: {
    titleClass: 'font-sans font-medium tracking-tight text-white leading-snug text-xl sm:text-2xl',
    descriptionClass: 'font-sans text-xs sm:text-sm text-emerald-100/70',
    badgeClass: 'font-mono text-[10px] font-semibold text-emerald-300 tracking-wider uppercase',
    labelClass: 'font-sans text-sm font-medium text-emerald-50',
    metricClass: 'font-mono text-2xl font-bold text-white',
  },
  surface: {
    cardRounded: 'rounded-xl',
    cardBorder: 'border-emerald-500/20',
    cardBg: 'bg-[#0E1B24]/85',
    cardLeading: 'border-emerald-500/50 bg-[#122430] shadow-[0_0_25px_rgba(16,185,129,0.14)]',
    cardSelected: 'border-emerald-400/80 bg-emerald-950/40 ring-1 ring-emerald-400/50',
    surfaceShadow: 'shadow-[0_4px_20px_rgba(0,0,0,0.4)]',
    divider: 'border-emerald-500/15',
  },
  animation: {
    intensity: 'calm',
    pulseFrequencySeconds: 1.15,
    pulseScalePeak: 1.04,
    pulseRhythm: 'relaxed',
    rippleSpeed: '2.0s',
  },
  visualDetails: {
    primaryIcon: 'GraduationCap',
    personalityBadge: 'CLASSROOM · CALM EDUCATIONAL',
    statusIndicator: 'Student Comprehension Barometer',
    specialWidget: 'none',
    widgetLabel: 'LECTURE SYNC',
    widgetText: 'Cohort Pacing Optimal',
  },
  presentation: {
    stageBackdrop: 'bg-[#080E14]',
    headerBadge: 'LECTURE HALL MODE',
    titleSize: 'text-3xl sm:text-5xl font-medium tracking-tight',
    qrBadgeStyle: 'border-emerald-500/30 text-emerald-300',
    layoutArchetype: 'lecture',
  },
  nodeBaseSize: 32,
  nodeGrowthFactor: 32,
  palette: [
    { id: 'cl1', label: 'Concept A', border: 'rgba(16, 185, 129, 0.45)', text: '#34d399', glow: 'rgba(16, 185, 129, 0.22)', bg: 'rgba(16, 185, 129, 0.07)', accent: '#10b981', barColor: '#10b981' },
    { id: 'cl2', label: 'Concept B', border: 'rgba(52, 211, 153, 0.45)', text: '#6ee7b7', glow: 'rgba(52, 211, 153, 0.22)', bg: 'rgba(52, 211, 153, 0.07)', accent: '#059669', barColor: '#059669' },
    { id: 'cl3', label: 'Concept C', border: 'rgba(56, 189, 248, 0.45)', text: '#38bdf8', glow: 'rgba(56, 189, 248, 0.22)', bg: 'rgba(56, 189, 248, 0.07)', accent: '#0284c7', barColor: '#0284c7' },
    { id: 'cl4', label: 'Concept D', border: 'rgba(251, 191, 36, 0.45)', text: '#fbbf24', glow: 'rgba(251, 191, 36, 0.22)', bg: 'rgba(251, 191, 36, 0.07)', accent: '#d97706', barColor: '#d97706' },
  ],
  leadPalette: {
    border: 'rgba(16, 185, 129, 0.6)',
    text: '#6ee7b7',
    glow: 'rgba(16, 185, 129, 0.3)',
    bg: 'rgba(6, 78, 59, 0.2)',
    badgeBg: 'rgba(2, 44, 34, 0.75)',
    badgeBorder: 'rgba(16, 185, 129, 0.4)',
  },
  cssVariables: {
    '--pulse-primary-color': '#10b981',
    '--pulse-secondary-color': '#34d399',
    '--pulse-theme-glow': 'rgba(16, 185, 129, 0.22)',
    '--pulse-theme-border': 'rgba(16, 185, 129, 0.35)',
    '--pulse-node-core-size': '32px',
    '--pulse-frequency': '1.15s',
    '--pulse-wave-speed': '2.0s',
  },
  tailwindClasses: {
    containerBorder: 'border-emerald-500/25',
    containerGlow: 'shadow-[0_0_45px_rgba(16,185,129,0.06)]',
    gridBg: 'bg-[#071118]',
    cardBorder: 'border-emerald-500/18',
    cardBg: 'bg-[#0C1A23]/90',
    cardLeading: 'border-emerald-500/50 bg-[#102431] shadow-[0_0_25px_rgba(16,185,129,0.15)]',
    cardSelected: 'border-emerald-400/80 bg-emerald-950/40 ring-1 ring-emerald-400/50',
    badge: 'border-emerald-500/30 bg-emerald-950/50 text-emerald-300',
    progressBarBg: '#10b981',
    accentText: 'text-emerald-400',
  },
};

// ---------------------------------------------------------------------------
// 2. TEAM / WORK — professional, sophisticated, minimal
// ---------------------------------------------------------------------------
export const THEME_TEAM_WORK: PulseTheme = {
  id: 'theme-team-work',
  name: 'Executive Minimal',
  personality: 'team-work',
  personalityLabel: 'TEAM / WORK',
  tagline: 'Professional, sophisticated, minimal architecture for leadership decisions',
  atmosphere: {
    previewBg: 'bg-[#08090C]',
    previewGradient: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.08) 0%, rgba(8, 9, 12, 0.98) 75%)',
    presentationBg: 'bg-[#060709]',
    patternClass: 'pattern-hairline-grid',
    overlayOpacity: 0.25,
  },
  accentColors: {
    primary: '#3b82f6',
    secondary: '#94a3b8',
    glow: 'rgba(59, 130, 246, 0.18)',
    border: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'rgba(30, 41, 59, 0.5)',
    badgeBorder: 'rgba(148, 163, 184, 0.2)',
    badgeText: '#cbd5e1',
  },
  typography: {
    titleClass: 'font-sans font-semibold tracking-tight text-zinc-100 text-xl sm:text-2xl leading-snug',
    descriptionClass: 'font-mono text-xs text-zinc-400',
    badgeClass: 'font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-widest',
    labelClass: 'font-sans text-sm font-medium text-zinc-200',
    metricClass: 'font-mono text-2xl font-bold text-white',
  },
  surface: {
    cardRounded: 'rounded-lg',
    cardBorder: 'border-white/[0.09]',
    cardBg: 'bg-[#0E1015]/95',
    cardLeading: 'border-blue-500/40 bg-[#121620] shadow-[0_0_25px_rgba(59,130,246,0.12)]',
    cardSelected: 'border-blue-400 bg-blue-950/30 ring-1 ring-blue-400/40',
    surfaceShadow: 'shadow-none',
    divider: 'border-white/[0.08]',
  },
  animation: {
    intensity: 'crisp',
    pulseFrequencySeconds: 0.75,
    pulseScalePeak: 1.05,
    pulseRhythm: 'standard',
    rippleSpeed: '1.4s',
  },
  visualDetails: {
    primaryIcon: 'Briefcase',
    personalityBadge: 'TEAM / WORK · EXECUTIVE PRECISION',
    statusIndicator: 'Strategic Alignment Protocol',
    specialWidget: 'none',
    widgetLabel: 'WORKSTREAM',
    widgetText: 'Executive Consensus',
  },
  presentation: {
    stageBackdrop: 'bg-[#060709]',
    headerBadge: 'EXECUTIVE BOARDROOM',
    titleSize: 'text-3xl sm:text-5xl font-semibold tracking-tight',
    qrBadgeStyle: 'border-white/[0.15] text-zinc-300',
    layoutArchetype: 'boardroom',
  },
  nodeBaseSize: 34,
  nodeGrowthFactor: 34,
  palette: [
    { id: 'tw1', label: 'Item 1', border: 'rgba(59, 130, 246, 0.45)', text: '#60a5fa', glow: 'rgba(59, 130, 246, 0.2)', bg: 'rgba(59, 130, 246, 0.06)', accent: '#3b82f6', barColor: '#3b82f6' },
    { id: 'tw2', label: 'Item 2', border: 'rgba(148, 163, 184, 0.4)', text: '#cbd5e1', glow: 'rgba(148, 163, 184, 0.15)', bg: 'rgba(148, 163, 184, 0.05)', accent: '#94a3b8', barColor: '#94a3b8' },
    { id: 'tw3', label: 'Item 3', border: 'rgba(99, 102, 241, 0.45)', text: '#818cf8', glow: 'rgba(99, 102, 241, 0.2)', bg: 'rgba(99, 102, 241, 0.06)', accent: '#6366f1', barColor: '#6366f1' },
    { id: 'tw4', label: 'Item 4', border: 'rgba(45, 212, 191, 0.45)', text: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.2)', bg: 'rgba(45, 212, 191, 0.06)', accent: '#14b8a6', barColor: '#14b8a6' },
  ],
  leadPalette: {
    border: 'rgba(59, 130, 246, 0.55)',
    text: '#93c5fd',
    glow: 'rgba(59, 130, 246, 0.25)',
    bg: 'rgba(30, 58, 138, 0.2)',
    badgeBg: 'rgba(15, 23, 42, 0.8)',
    badgeBorder: 'rgba(59, 130, 246, 0.35)',
  },
  cssVariables: {
    '--pulse-primary-color': '#3b82f6',
    '--pulse-secondary-color': '#94a3b8',
    '--pulse-theme-glow': 'rgba(59, 130, 246, 0.18)',
    '--pulse-theme-border': 'rgba(255, 255, 255, 0.12)',
    '--pulse-node-core-size': '34px',
    '--pulse-frequency': '0.75s',
    '--pulse-wave-speed': '1.4s',
  },
  tailwindClasses: {
    containerBorder: 'border-white/[0.12]',
    containerGlow: 'shadow-[0_0_40px_rgba(59,130,246,0.04)]',
    gridBg: 'bg-[#08090C]',
    cardBorder: 'border-white/[0.08]',
    cardBg: 'bg-[#0E1015]/95',
    cardLeading: 'border-blue-500/40 bg-[#121620] shadow-[0_0_25px_rgba(59,130,246,0.12)]',
    cardSelected: 'border-blue-400 bg-blue-950/30 ring-1 ring-blue-400/40',
    badge: 'border-white/[0.12] bg-white/[0.04] text-zinc-300',
    progressBarBg: '#3b82f6',
    accentText: 'text-blue-400',
  },
};

// ---------------------------------------------------------------------------
// 3. LIVE EVENT — energetic, large typography, stronger realtime pulses
// ---------------------------------------------------------------------------
export const THEME_LIVE_EVENT: PulseTheme = {
  id: 'theme-live-event',
  name: 'Arena High Voltage',
  personality: 'live-event',
  personalityLabel: 'LIVE EVENT',
  tagline: 'Energetic, large typography, stronger realtime pulses for stadium stages',
  atmosphere: {
    previewBg: 'bg-[#090414]',
    previewGradient: 'radial-gradient(circle at 50% 0%, rgba(236, 72, 153, 0.22) 0%, rgba(139, 92, 246, 0.15) 45%, rgba(9, 4, 20, 0.98) 80%)',
    presentationBg: 'bg-[#070310]',
    patternClass: 'pattern-stage-spotlights',
    overlayOpacity: 0.6,
  },
  accentColors: {
    primary: '#ec4899',
    secondary: '#8b5cf6',
    glow: 'rgba(236, 72, 153, 0.35)',
    border: 'rgba(236, 72, 153, 0.45)',
    badgeBg: 'rgba(131, 24, 67, 0.5)',
    badgeBorder: 'rgba(236, 72, 153, 0.5)',
    badgeText: '#f472b6',
  },
  typography: {
    titleClass: 'font-black tracking-tighter uppercase text-white leading-tight text-2xl sm:text-3xl',
    descriptionClass: 'font-mono text-xs sm:text-sm text-pink-200/80 font-semibold tracking-wide',
    badgeClass: 'font-mono text-[10px] font-black text-pink-300 uppercase tracking-widest',
    labelClass: 'font-black text-sm uppercase tracking-tight text-white',
    metricClass: 'font-mono text-3xl font-black text-pink-400',
  },
  surface: {
    cardRounded: 'rounded-2xl',
    cardBorder: 'border-pink-500/30',
    cardBg: 'bg-[#140824]/90',
    cardLeading: 'border-pink-500/80 bg-[#250B3E] shadow-[0_0_40px_rgba(236,72,153,0.3)] ring-2 ring-pink-400/60',
    cardSelected: 'border-pink-400 bg-pink-950/50 shadow-[0_0_30px_rgba(236,72,153,0.35)] ring-2 ring-pink-400',
    surfaceShadow: 'shadow-[0_0_50px_rgba(236,72,153,0.18)]',
    divider: 'border-pink-500/20',
  },
  animation: {
    intensity: 'explosive',
    pulseFrequencySeconds: 0.42,
    pulseScalePeak: 1.20,
    pulseRhythm: 'rapid',
    rippleSpeed: '0.8s',
  },
  visualDetails: {
    primaryIcon: 'Zap',
    personalityBadge: 'LIVE EVENT · ARENA STAGE',
    statusIndicator: 'Audience Decibel Wave Active',
    specialWidget: 'celebration',
    widgetLabel: 'DECIBEL SURGE',
    widgetText: '98.4 dB Crowd Surge',
  },
  presentation: {
    stageBackdrop: 'bg-[#070310]',
    headerBadge: 'ARENA JUMBOTRON',
    titleSize: 'text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter uppercase',
    qrBadgeStyle: 'border-pink-500/50 text-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.3)]',
    layoutArchetype: 'arena',
  },
  nodeBaseSize: 42,
  nodeGrowthFactor: 48,
  palette: [
    { id: 'le1', label: 'Option A', border: 'rgba(236, 72, 153, 0.6)', text: '#f472b6', glow: 'rgba(236, 72, 153, 0.35)', bg: 'rgba(236, 72, 153, 0.12)', accent: '#ec4899', barColor: '#ec4899' },
    { id: 'le2', label: 'Option B', border: 'rgba(168, 85, 247, 0.6)', text: '#c084fc', glow: 'rgba(168, 85, 247, 0.35)', bg: 'rgba(168, 85, 247, 0.12)', accent: '#a855f7', barColor: '#a855f7' },
    { id: 'le3', label: 'Option C', border: 'rgba(6, 182, 212, 0.6)', text: '#22d3ee', glow: 'rgba(6, 182, 212, 0.35)', bg: 'rgba(6, 182, 212, 0.12)', accent: '#06b6d4', barColor: '#06b6d4' },
    { id: 'le4', label: 'Option D', border: 'rgba(244, 63, 94, 0.6)', text: '#fb7185', glow: 'rgba(244, 63, 94, 0.35)', bg: 'rgba(244, 63, 94, 0.12)', accent: '#f43f5e', barColor: '#f43f5e' },
  ],
  leadPalette: {
    border: 'rgba(236, 72, 153, 0.85)',
    text: '#fbcfe8',
    glow: 'rgba(236, 72, 153, 0.45)',
    bg: 'rgba(131, 24, 67, 0.35)',
    badgeBg: 'rgba(80, 7, 36, 0.85)',
    badgeBorder: 'rgba(236, 72, 153, 0.6)',
  },
  cssVariables: {
    '--pulse-primary-color': '#ec4899',
    '--pulse-secondary-color': '#8b5cf6',
    '--pulse-theme-glow': 'rgba(236, 72, 153, 0.35)',
    '--pulse-theme-border': 'rgba(236, 72, 153, 0.5)',
    '--pulse-node-core-size': '42px',
    '--pulse-frequency': '0.42s',
    '--pulse-wave-speed': '0.8s',
  },
  tailwindClasses: {
    containerBorder: 'border-pink-500/35',
    containerGlow: 'shadow-[0_0_60px_rgba(236,72,153,0.18)]',
    gridBg: 'bg-[#090414]',
    cardBorder: 'border-pink-500/25',
    cardBg: 'bg-[#150926]/90',
    cardLeading: 'border-pink-500/80 bg-[#250B3E] shadow-[0_0_35px_rgba(236,72,153,0.3)] ring-1 ring-pink-400',
    cardSelected: 'border-pink-400 bg-pink-950/50 shadow-[0_0_30px_rgba(236,72,153,0.35)] ring-2 ring-pink-400',
    badge: 'border-pink-500/40 bg-pink-950/60 text-pink-300 font-bold',
    progressBarBg: '#ec4899',
    accentText: 'text-pink-400',
  },
};

// ---------------------------------------------------------------------------
// 4. QUIZ — interactive, countdown-focused, engaging
// ---------------------------------------------------------------------------
export const THEME_QUIZ: PulseTheme = {
  id: 'theme-quiz',
  name: 'Trivia Countdown',
  personality: 'quiz',
  personalityLabel: 'QUIZ',
  tagline: 'Interactive, countdown-focused, engaging trivia arena with timed rounds',
  atmosphere: {
    previewBg: 'bg-[#0B0818]',
    previewGradient: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.18) 0%, rgba(147, 51, 234, 0.14) 40%, rgba(11, 8, 24, 0.98) 75%)',
    presentationBg: 'bg-[#090615]',
    patternClass: 'pattern-quiz-halo',
    overlayOpacity: 0.5,
  },
  accentColors: {
    primary: '#f59e0b',
    secondary: '#a855f7',
    glow: 'rgba(245, 158, 11, 0.3)',
    border: 'rgba(245, 158, 11, 0.4)',
    badgeBg: 'rgba(120, 53, 15, 0.5)',
    badgeBorder: 'rgba(245, 158, 11, 0.4)',
    badgeText: '#fde68a',
  },
  typography: {
    titleClass: 'font-extrabold tracking-tight text-white leading-snug text-xl sm:text-2xl',
    descriptionClass: 'font-mono text-xs sm:text-sm text-amber-200/80 font-medium',
    badgeClass: 'font-mono text-[10px] font-black text-amber-300 uppercase tracking-widest',
    labelClass: 'font-sans text-sm font-bold text-amber-50',
    metricClass: 'font-mono text-2xl font-black text-amber-400',
  },
  surface: {
    cardRounded: 'rounded-xl',
    cardBorder: 'border-amber-500/25',
    cardBg: 'bg-[#150E28]/90',
    cardLeading: 'border-amber-500/70 bg-[#251540] shadow-[0_0_35px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/60',
    cardSelected: 'border-amber-400 bg-amber-950/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-2 ring-amber-400',
    surfaceShadow: 'shadow-[0_0_40px_rgba(245,158,11,0.12)]',
    divider: 'border-amber-500/20',
  },
  animation: {
    intensity: 'bouncy',
    pulseFrequencySeconds: 0.55,
    pulseScalePeak: 1.14,
    pulseRhythm: 'energetic',
    rippleSpeed: '1.0s',
  },
  visualDetails: {
    primaryIcon: 'Timer',
    personalityBadge: 'QUIZ · TIMED TRIVIA ARENA',
    statusIndicator: 'Round 1 Active · Countdown Live',
    specialWidget: 'countdown',
    widgetLabel: 'ROUND TIMER',
    widgetText: '⏱ 00:45 REMAINING',
    countdownSeconds: 45,
  },
  presentation: {
    stageBackdrop: 'bg-[#090615]',
    headerBadge: 'TELEVISED TRIVIA ARENA',
    titleSize: 'text-3xl sm:text-5xl font-black tracking-tight text-amber-50',
    qrBadgeStyle: 'border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    layoutArchetype: 'gameshow',
  },
  nodeBaseSize: 38,
  nodeGrowthFactor: 42,
  palette: [
    { id: 'qz1', label: 'Answer A', border: 'rgba(245, 158, 11, 0.55)', text: '#fbbf24', glow: 'rgba(245, 158, 11, 0.3)', bg: 'rgba(245, 158, 11, 0.1)', accent: '#f59e0b', barColor: '#f59e0b' },
    { id: 'qz2', label: 'Answer B', border: 'rgba(168, 85, 247, 0.55)', text: '#c084fc', glow: 'rgba(168, 85, 247, 0.3)', bg: 'rgba(168, 85, 247, 0.1)', accent: '#a855f7', barColor: '#a855f7' },
    { id: 'qz3', label: 'Answer C', border: 'rgba(251, 113, 133, 0.55)', text: '#fb7185', glow: 'rgba(251, 113, 133, 0.3)', bg: 'rgba(251, 113, 133, 0.1)', accent: '#f43f5e', barColor: '#f43f5e' },
    { id: 'qz4', label: 'Answer D', border: 'rgba(56, 189, 248, 0.55)', text: '#38bdf8', glow: 'rgba(56, 189, 248, 0.3)', bg: 'rgba(56, 189, 248, 0.1)', accent: '#0284c7', barColor: '#0284c7' },
  ],
  leadPalette: {
    border: 'rgba(245, 158, 11, 0.8)',
    text: '#fde68a',
    glow: 'rgba(245, 158, 11, 0.45)',
    bg: 'rgba(120, 53, 15, 0.3)',
    badgeBg: 'rgba(69, 26, 3, 0.85)',
    badgeBorder: 'rgba(245, 158, 11, 0.5)',
  },
  cssVariables: {
    '--pulse-primary-color': '#f59e0b',
    '--pulse-secondary-color': '#a855f7',
    '--pulse-theme-glow': 'rgba(245, 158, 11, 0.3)',
    '--pulse-theme-border': 'rgba(245, 158, 11, 0.4)',
    '--pulse-node-core-size': '38px',
    '--pulse-frequency': '0.55s',
    '--pulse-wave-speed': '1.0s',
  },
  tailwindClasses: {
    containerBorder: 'border-amber-500/30',
    containerGlow: 'shadow-[0_0_50px_rgba(245,158,11,0.12)]',
    gridBg: 'bg-[#0B0818]',
    cardBorder: 'border-amber-500/20',
    cardBg: 'bg-[#150E28]/90',
    cardLeading: 'border-amber-500/70 bg-[#251540] shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    cardSelected: 'border-amber-400 bg-amber-950/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-400',
    badge: 'border-amber-500/35 bg-amber-950/60 text-amber-300 font-bold',
    progressBarBg: '#f59e0b',
    accentText: 'text-amber-400',
  },
};

// ---------------------------------------------------------------------------
// 5. COMPETITION — bold, dynamic, results-focused
// ---------------------------------------------------------------------------
export const THEME_COMPETITION: PulseTheme = {
  id: 'theme-competition',
  name: 'Tournament Championship',
  personality: 'competition',
  personalityLabel: 'COMPETITION',
  tagline: 'Bold, dynamic, results-focused tournament battle with live rankings',
  atmosphere: {
    previewBg: 'bg-[#0E0505]',
    previewGradient: 'radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.2) 0%, rgba(234, 179, 8, 0.12) 40%, rgba(14, 5, 5, 0.98) 75%)',
    presentationBg: 'bg-[#0C0404]',
    patternClass: 'pattern-speed-lines',
    overlayOpacity: 0.55,
  },
  accentColors: {
    primary: '#ef4444',
    secondary: '#eab308',
    glow: 'rgba(239, 68, 68, 0.32)',
    border: 'rgba(239, 68, 68, 0.45)',
    badgeBg: 'rgba(127, 29, 29, 0.5)',
    badgeBorder: 'rgba(239, 68, 68, 0.4)',
    badgeText: '#fca5a5',
  },
  typography: {
    titleClass: 'font-black tracking-tight uppercase italic text-white text-xl sm:text-2xl leading-tight',
    descriptionClass: 'font-mono text-xs sm:text-sm text-red-200/80 font-bold',
    badgeClass: 'font-mono text-[10px] font-black text-red-300 uppercase tracking-widest',
    labelClass: 'font-mono text-sm font-black uppercase text-red-50',
    metricClass: 'font-mono text-3xl font-black text-red-400',
  },
  surface: {
    cardRounded: 'rounded-lg',
    cardBorder: 'border-red-500/30',
    cardBg: 'bg-[#180808]/95',
    cardLeading: 'border-amber-400/90 bg-[#280C0C] shadow-[0_0_35px_rgba(234,179,8,0.25)] ring-2 ring-amber-400/80',
    cardSelected: 'border-red-400 bg-red-950/60 shadow-[0_0_30px_rgba(239,68,68,0.3)] ring-2 ring-red-400',
    surfaceShadow: 'shadow-[0_0_45px_rgba(239,68,68,0.16)]',
    divider: 'border-red-500/25',
  },
  animation: {
    intensity: 'explosive',
    pulseFrequencySeconds: 0.45,
    pulseScalePeak: 1.18,
    pulseRhythm: 'rapid',
    rippleSpeed: '0.9s',
  },
  visualDetails: {
    primaryIcon: 'Trophy',
    personalityBadge: 'COMPETITION · LIVE LEADERBOARD',
    statusIndicator: 'Live Race · Podium Realtime Delta',
    specialWidget: 'leaderboard',
    widgetLabel: 'LEADERBOARD',
    widgetText: 'PODIUM RACE: #1 SHIFTING',
  },
  presentation: {
    stageBackdrop: 'bg-[#0C0404]',
    headerBadge: 'CHAMPIONSHIP ARENA',
    titleSize: 'text-3xl sm:text-5xl lg:text-6xl font-black uppercase italic tracking-tight',
    qrBadgeStyle: 'border-red-500/50 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    layoutArchetype: 'tournament',
  },
  nodeBaseSize: 40,
  nodeGrowthFactor: 44,
  palette: [
    { id: 'cp1', label: 'Finalist 1', border: 'rgba(239, 68, 68, 0.6)', text: '#fca5a5', glow: 'rgba(239, 68, 68, 0.35)', bg: 'rgba(239, 68, 68, 0.12)', accent: '#ef4444', barColor: '#ef4444' },
    { id: 'cp2', label: 'Finalist 2', border: 'rgba(234, 179, 8, 0.6)', text: '#fde047', glow: 'rgba(234, 179, 8, 0.35)', bg: 'rgba(234, 179, 8, 0.12)', accent: '#eab308', barColor: '#eab308' },
    { id: 'cp3', label: 'Finalist 3', border: 'rgba(249, 115, 22, 0.6)', text: '#fdba74', glow: 'rgba(249, 115, 22, 0.35)', bg: 'rgba(249, 115, 22, 0.12)', accent: '#f97316', barColor: '#f97316' },
    { id: 'cp4', label: 'Finalist 4', border: 'rgba(244, 63, 94, 0.6)', text: '#fda4af', glow: 'rgba(244, 63, 94, 0.35)', bg: 'rgba(244, 63, 94, 0.12)', accent: '#f43f5e', barColor: '#f43f5e' },
  ],
  leadPalette: {
    border: 'rgba(234, 179, 8, 0.9)',
    text: '#fef08a',
    glow: 'rgba(234, 179, 8, 0.45)',
    bg: 'rgba(113, 63, 18, 0.35)',
    badgeBg: 'rgba(66, 32, 6, 0.9)',
    badgeBorder: 'rgba(234, 179, 8, 0.7)',
  },
  cssVariables: {
    '--pulse-primary-color': '#ef4444',
    '--pulse-secondary-color': '#eab308',
    '--pulse-theme-glow': 'rgba(239, 68, 68, 0.32)',
    '--pulse-theme-border': 'rgba(239, 68, 68, 0.45)',
    '--pulse-node-core-size': '40px',
    '--pulse-frequency': '0.45s',
    '--pulse-wave-speed': '0.9s',
  },
  tailwindClasses: {
    containerBorder: 'border-red-500/35',
    containerGlow: 'shadow-[0_0_55px_rgba(239,68,68,0.16)]',
    gridBg: 'bg-[#0E0505]',
    cardBorder: 'border-red-500/25',
    cardBg: 'bg-[#180808]/95',
    cardLeading: 'border-amber-400/90 bg-[#280C0C] shadow-[0_0_35px_rgba(234,179,8,0.25)] ring-1 ring-amber-400',
    cardSelected: 'border-red-400 bg-red-950/60 shadow-[0_0_30px_rgba(239,68,68,0.3)] ring-2 ring-red-400',
    badge: 'border-red-500/40 bg-red-950/60 text-red-300 font-bold',
    progressBarBg: '#ef4444',
    accentText: 'text-red-400',
  },
};

// ---------------------------------------------------------------------------
// 6. BRAINSTORM — creative, editorial, idea-focused
// ---------------------------------------------------------------------------
export const THEME_BRAINSTORM: PulseTheme = {
  id: 'theme-brainstorm',
  name: 'Creative Studio Horizon',
  personality: 'brainstorm',
  personalityLabel: 'BRAINSTORM',
  tagline: 'Creative, editorial, idea-focused collaborative sandbox for design sprints',
  atmosphere: {
    previewBg: 'bg-[#0F0A15]',
    previewGradient: 'radial-gradient(circle at 50% 0%, rgba(192, 132, 252, 0.16) 0%, rgba(52, 211, 153, 0.08) 45%, rgba(15, 10, 21, 0.98) 75%)',
    presentationBg: 'bg-[#0C0812]',
    patternClass: 'pattern-constellation',
    overlayOpacity: 0.45,
  },
  accentColors: {
    primary: '#c084fc',
    secondary: '#34d399',
    glow: 'rgba(192, 132, 252, 0.25)',
    border: 'rgba(192, 132, 252, 0.35)',
    badgeBg: 'rgba(88, 28, 135, 0.4)',
    badgeBorder: 'rgba(192, 132, 252, 0.3)',
    badgeText: '#e9d5ff',
  },
  typography: {
    titleClass: 'font-sans font-semibold tracking-wide text-purple-50 text-xl sm:text-2xl leading-snug',
    descriptionClass: 'font-sans text-xs sm:text-sm text-purple-200/70',
    badgeClass: 'font-mono text-[10px] font-semibold text-purple-300 uppercase tracking-wider',
    labelClass: 'font-sans text-sm font-medium text-purple-100',
    metricClass: 'font-mono text-2xl font-bold text-purple-200',
  },
  surface: {
    cardRounded: 'rounded-2xl',
    cardBorder: 'border-dashed border-purple-400/30',
    cardBg: 'bg-[#160E22]/85',
    cardLeading: 'border-purple-400/70 bg-[#241538] shadow-[0_0_30px_rgba(192,132,252,0.18)]',
    cardSelected: 'border-purple-400 bg-purple-950/40 ring-1 ring-purple-400/50',
    surfaceShadow: 'shadow-[0_4px_25px_rgba(192,132,252,0.08)]',
    divider: 'border-purple-500/15',
  },
  animation: {
    intensity: 'fluid',
    pulseFrequencySeconds: 1.25,
    pulseScalePeak: 1.06,
    pulseRhythm: 'relaxed',
    rippleSpeed: '2.2s',
  },
  visualDetails: {
    primaryIcon: 'Lightbulb',
    personalityBadge: 'BRAINSTORM · CREATIVE SANDBOX',
    statusIndicator: 'Idea Clustering & Organic Synthesis',
    specialWidget: 'brainstorm',
    widgetLabel: 'CONCEPT CLUSTER',
    widgetText: 'Emerging Idea Horizon',
  },
  presentation: {
    stageBackdrop: 'bg-[#0C0812]',
    headerBadge: 'DESIGN STUDIO WHITEBOARD',
    titleSize: 'text-3xl sm:text-5xl font-semibold tracking-wide text-purple-50',
    qrBadgeStyle: 'border-purple-400/30 text-purple-300',
    layoutArchetype: 'studio',
  },
  nodeBaseSize: 34,
  nodeGrowthFactor: 36,
  palette: [
    { id: 'br1', label: 'Idea 1', border: 'rgba(192, 132, 252, 0.45)', text: '#d8b4fe', glow: 'rgba(192, 132, 252, 0.22)', bg: 'rgba(192, 132, 252, 0.08)', accent: '#c084fc', barColor: '#c084fc' },
    { id: 'br2', label: 'Idea 2', border: 'rgba(52, 211, 153, 0.45)', text: '#6ee7b7', glow: 'rgba(52, 211, 153, 0.22)', bg: 'rgba(52, 211, 153, 0.08)', accent: '#34d399', barColor: '#34d399' },
    { id: 'br3', label: 'Idea 3', border: 'rgba(251, 146, 60, 0.45)', text: '#fdba74', glow: 'rgba(251, 146, 60, 0.22)', bg: 'rgba(251, 146, 60, 0.08)', accent: '#fb923c', barColor: '#fb923c' },
    { id: 'br4', label: 'Idea 4', border: 'rgba(56, 189, 248, 0.45)', text: '#7dd3fc', glow: 'rgba(56, 189, 248, 0.22)', bg: 'rgba(56, 189, 248, 0.08)', accent: '#38bdf8', barColor: '#38bdf8' },
  ],
  leadPalette: {
    border: 'rgba(192, 132, 252, 0.65)',
    text: '#f3e8ff',
    glow: 'rgba(192, 132, 252, 0.35)',
    bg: 'rgba(88, 28, 135, 0.25)',
    badgeBg: 'rgba(59, 7, 100, 0.8)',
    badgeBorder: 'rgba(192, 132, 252, 0.4)',
  },
  cssVariables: {
    '--pulse-primary-color': '#c084fc',
    '--pulse-secondary-color': '#34d399',
    '--pulse-theme-glow': 'rgba(192, 132, 252, 0.25)',
    '--pulse-theme-border': 'rgba(192, 132, 252, 0.35)',
    '--pulse-node-core-size': '34px',
    '--pulse-frequency': '1.25s',
    '--pulse-wave-speed': '2.2s',
  },
  tailwindClasses: {
    containerBorder: 'border-purple-500/25',
    containerGlow: 'shadow-[0_0_45px_rgba(192,132,252,0.08)]',
    gridBg: 'bg-[#0F0A15]',
    cardBorder: 'border-purple-500/20',
    cardBg: 'bg-[#160E22]/90',
    cardLeading: 'border-purple-400/70 bg-[#241538] shadow-[0_0_25px_rgba(192,132,252,0.18)]',
    cardSelected: 'border-purple-400 bg-purple-950/40 ring-1 ring-purple-400/50',
    badge: 'border-purple-500/30 bg-purple-950/50 text-purple-300',
    progressBarBg: '#c084fc',
    accentText: 'text-purple-400',
  },
};

// ---------------------------------------------------------------------------
// 7. PARTY / SOCIAL — expressive and celebratory but still premium
// ---------------------------------------------------------------------------
export const THEME_PARTY_SOCIAL: PulseTheme = {
  id: 'theme-party-social',
  name: 'Champagne Gala Disco',
  personality: 'party-social',
  personalityLabel: 'PARTY / SOCIAL',
  tagline: 'Expressive and celebratory but still premium for social milestones',
  atmosphere: {
    previewBg: 'bg-[#110719]',
    previewGradient: 'radial-gradient(circle at 50% 0%, rgba(244, 63, 94, 0.2) 0%, rgba(251, 191, 36, 0.12) 40%, rgba(17, 7, 25, 0.98) 75%)',
    presentationBg: 'bg-[#0D0514]',
    patternClass: 'pattern-celebration-sparkles',
    overlayOpacity: 0.55,
  },
  accentColors: {
    primary: '#f43f5e',
    secondary: '#fbbf24',
    glow: 'rgba(244, 63, 94, 0.3)',
    border: 'rgba(244, 63, 94, 0.4)',
    badgeBg: 'rgba(136, 19, 55, 0.5)',
    badgeBorder: 'rgba(244, 63, 94, 0.4)',
    badgeText: '#fecdd3',
  },
  typography: {
    titleClass: 'font-extrabold tracking-tight text-rose-50 text-xl sm:text-2xl leading-snug',
    descriptionClass: 'font-sans text-xs sm:text-sm text-rose-200/80',
    badgeClass: 'font-mono text-[10px] font-black text-rose-300 uppercase tracking-wider',
    labelClass: 'font-sans text-sm font-bold text-rose-50',
    metricClass: 'font-mono text-2xl font-black text-rose-300',
  },
  surface: {
    cardRounded: 'rounded-2xl',
    cardBorder: 'border-rose-500/30',
    cardBg: 'bg-[#1C0A2A]/90',
    cardLeading: 'border-rose-400/80 bg-[#2D0F3F] shadow-[0_0_35px_rgba(244,63,94,0.22)] ring-1 ring-rose-400/60',
    cardSelected: 'border-rose-400 bg-rose-950/50 shadow-[0_0_25px_rgba(244,63,94,0.3)] ring-2 ring-rose-400',
    surfaceShadow: 'shadow-[0_0_45px_rgba(244,63,94,0.15)]',
    divider: 'border-rose-500/20',
  },
  animation: {
    intensity: 'bouncy',
    pulseFrequencySeconds: 0.52,
    pulseScalePeak: 1.16,
    pulseRhythm: 'energetic',
    rippleSpeed: '1.0s',
  },
  visualDetails: {
    primaryIcon: 'PartyPopper',
    personalityBadge: 'PARTY / SOCIAL · CELEBRATION',
    statusIndicator: 'Crowd Vibe: Electric & Toasting',
    specialWidget: 'celebration',
    widgetLabel: 'CROWD VIBE',
    widgetText: '🎉 High Spirits & Toasting',
  },
  presentation: {
    stageBackdrop: 'bg-[#0D0514]',
    headerBadge: 'VIP PARTY LOUNGE',
    titleSize: 'text-3xl sm:text-5xl font-black tracking-tight text-rose-50',
    qrBadgeStyle: 'border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]',
    layoutArchetype: 'lounge',
  },
  nodeBaseSize: 38,
  nodeGrowthFactor: 42,
  palette: [
    { id: 'ps1', label: 'Vibe A', border: 'rgba(244, 63, 94, 0.55)', text: '#fb7185', glow: 'rgba(244, 63, 94, 0.3)', bg: 'rgba(244, 63, 94, 0.1)', accent: '#f43f5e', barColor: '#f43f5e' },
    { id: 'ps2', label: 'Vibe B', border: 'rgba(251, 191, 36, 0.55)', text: '#fde047', glow: 'rgba(251, 191, 36, 0.3)', bg: 'rgba(251, 191, 36, 0.1)', accent: '#fbbf24', barColor: '#fbbf24' },
    { id: 'ps3', label: 'Vibe C', border: 'rgba(56, 189, 248, 0.55)', text: '#38bdf8', glow: 'rgba(56, 189, 248, 0.3)', bg: 'rgba(56, 189, 248, 0.1)', accent: '#0284c7', barColor: '#0284c7' },
    { id: 'ps4', label: 'Vibe D', border: 'rgba(163, 230, 53, 0.55)', text: '#a3e635', glow: 'rgba(163, 230, 53, 0.3)', bg: 'rgba(163, 230, 53, 0.1)', accent: '#84cc16', barColor: '#84cc16' },
  ],
  leadPalette: {
    border: 'rgba(244, 63, 94, 0.8)',
    text: '#ffe4e6',
    glow: 'rgba(244, 63, 94, 0.4)',
    bg: 'rgba(136, 19, 55, 0.3)',
    badgeBg: 'rgba(76, 5, 25, 0.85)',
    badgeBorder: 'rgba(244, 63, 94, 0.5)',
  },
  cssVariables: {
    '--pulse-primary-color': '#f43f5e',
    '--pulse-secondary-color': '#fbbf24',
    '--pulse-theme-glow': 'rgba(244, 63, 94, 0.3)',
    '--pulse-theme-border': 'rgba(244, 63, 94, 0.4)',
    '--pulse-node-core-size': '38px',
    '--pulse-frequency': '0.52s',
    '--pulse-wave-speed': '1.0s',
  },
  tailwindClasses: {
    containerBorder: 'border-rose-500/30',
    containerGlow: 'shadow-[0_0_50px_rgba(244,63,94,0.15)]',
    gridBg: 'bg-[#110719]',
    cardBorder: 'border-rose-500/20',
    cardBg: 'bg-[#1C0A2A]/90',
    cardLeading: 'border-rose-400/80 bg-[#2D0F3F] shadow-[0_0_30px_rgba(244,63,94,0.22)]',
    cardSelected: 'border-rose-400 bg-rose-950/50 shadow-[0_0_25px_rgba(244,63,94,0.25)] ring-1 ring-rose-400',
    badge: 'border-rose-500/35 bg-rose-950/60 text-rose-300 font-bold',
    progressBarBg: '#f43f5e',
    accentText: 'text-rose-400',
  },
};

// ---------------------------------------------------------------------------
// 8. SURVEY — minimal, clean, data-focused
// ---------------------------------------------------------------------------
export const THEME_SURVEY: PulseTheme = {
  id: 'theme-survey',
  name: 'Empirical Telemetry Matrix',
  personality: 'survey',
  personalityLabel: 'SURVEY',
  tagline: 'Minimal, clean, data-focused empirical telemetry with strict metrics',
  atmosphere: {
    previewBg: 'bg-[#070A0F]',
    previewGradient: 'radial-gradient(circle at 50% 0%, rgba(20, 184, 166, 0.10) 0%, rgba(7, 10, 15, 0.98) 75%)',
    presentationBg: 'bg-[#05080C]',
    patternClass: 'pattern-radar-grid',
    overlayOpacity: 0.35,
  },
  accentColors: {
    primary: '#14b8a6',
    secondary: '#0284c7',
    glow: 'rgba(20, 184, 166, 0.18)',
    border: 'rgba(20, 184, 166, 0.25)',
    badgeBg: 'rgba(19, 78, 74, 0.45)',
    badgeBorder: 'rgba(20, 184, 166, 0.3)',
    badgeText: '#5eead4',
  },
  typography: {
    titleClass: 'font-mono font-bold tracking-tight text-teal-100 text-lg sm:text-xl leading-snug',
    descriptionClass: 'font-mono text-xs text-teal-200/70',
    badgeClass: 'font-mono text-[10px] font-bold text-teal-300 uppercase tracking-widest',
    labelClass: 'font-mono text-xs sm:text-sm font-semibold text-zinc-200',
    metricClass: 'font-mono text-2xl font-black text-teal-300 tabular-nums',
  },
  surface: {
    cardRounded: 'rounded-md',
    cardBorder: 'border-teal-500/20',
    cardBg: 'bg-[#0B121A]/95',
    cardLeading: 'border-teal-400/60 bg-[#0E1A26] shadow-[0_0_20px_rgba(20,184,166,0.12)]',
    cardSelected: 'border-teal-400 bg-teal-950/40 ring-1 ring-teal-400/50',
    surfaceShadow: 'shadow-none',
    divider: 'border-teal-500/15',
  },
  animation: {
    intensity: 'clinical',
    pulseFrequencySeconds: 0.9,
    pulseScalePeak: 1.03,
    pulseRhythm: 'standard',
    rippleSpeed: '1.6s',
  },
  visualDetails: {
    primaryIcon: 'BarChart2',
    personalityBadge: 'SURVEY · EMPIRICAL METRICS',
    statusIndicator: 'Sample Size n=142 · 95% Confidence Interval',
    specialWidget: 'metrics',
    widgetLabel: 'QUANTITATIVE STATS',
    widgetText: 'n=142 · σ=0.14 · CI 95%',
  },
  presentation: {
    stageBackdrop: 'bg-[#05080C]',
    headerBadge: 'EXECUTIVE BRIEFING MATRIX',
    titleSize: 'text-2xl sm:text-4xl font-mono font-bold tracking-tight text-teal-100',
    qrBadgeStyle: 'border-teal-500/30 text-teal-300',
    layoutArchetype: 'briefing',
  },
  nodeBaseSize: 32,
  nodeGrowthFactor: 30,
  palette: [
    { id: 'sv1', label: 'Metric A', border: 'rgba(20, 184, 166, 0.45)', text: '#5eead4', glow: 'rgba(20, 184, 166, 0.2)', bg: 'rgba(20, 184, 166, 0.06)', accent: '#14b8a6', barColor: '#14b8a6' },
    { id: 'sv2', label: 'Metric B', border: 'rgba(2, 132, 199, 0.45)', text: '#38bdf8', glow: 'rgba(2, 132, 199, 0.2)', bg: 'rgba(2, 132, 199, 0.06)', accent: '#0284c7', barColor: '#0284c7' },
    { id: 'sv3', label: 'Metric C', border: 'rgba(99, 102, 241, 0.45)', text: '#818cf8', glow: 'rgba(99, 102, 241, 0.2)', bg: 'rgba(99, 102, 241, 0.06)', accent: '#6366f1', barColor: '#6366f1' },
    { id: 'sv4', label: 'Metric D', border: 'rgba(148, 163, 184, 0.4)', text: '#cbd5e1', glow: 'rgba(148, 163, 184, 0.15)', bg: 'rgba(148, 163, 184, 0.05)', accent: '#94a3b8', barColor: '#94a3b8' },
  ],
  leadPalette: {
    border: 'rgba(20, 184, 166, 0.6)',
    text: '#99f6e4',
    glow: 'rgba(20, 184, 166, 0.3)',
    bg: 'rgba(19, 78, 74, 0.25)',
    badgeBg: 'rgba(4, 47, 46, 0.8)',
    badgeBorder: 'rgba(20, 184, 166, 0.4)',
  },
  cssVariables: {
    '--pulse-primary-color': '#14b8a6',
    '--pulse-secondary-color': '#0284c7',
    '--pulse-theme-glow': 'rgba(20, 184, 166, 0.18)',
    '--pulse-theme-border': 'rgba(20, 184, 166, 0.25)',
    '--pulse-node-core-size': '32px',
    '--pulse-frequency': '0.9s',
    '--pulse-wave-speed': '1.6s',
  },
  tailwindClasses: {
    containerBorder: 'border-teal-500/20',
    containerGlow: 'shadow-[0_0_35px_rgba(20,184,166,0.06)]',
    gridBg: 'bg-[#070A0F]',
    cardBorder: 'border-teal-500/18',
    cardBg: 'bg-[#0B121A]/95',
    cardLeading: 'border-teal-400/60 bg-[#0E1A26] shadow-[0_0_20px_rgba(20,184,166,0.12)]',
    cardSelected: 'border-teal-400 bg-teal-950/40 ring-1 ring-teal-400/50',
    badge: 'border-teal-500/30 bg-teal-950/50 text-teal-300 font-mono',
    progressBarBg: '#14b8a6',
    accentText: 'text-teal-400',
  },
};

// ---------------------------------------------------------------------------
// 9. CONFERENCE — futuristic, premium, presentation-friendly
// ---------------------------------------------------------------------------
export const THEME_CONFERENCE: PulseTheme = {
  id: 'theme-conference',
  name: 'Cosmic Keynote Horizon',
  personality: 'conference',
  personalityLabel: 'CONFERENCE',
  tagline: 'Futuristic, premium, presentation-friendly keynote atmosphere',
  atmosphere: {
    previewBg: 'bg-[#050711]',
    previewGradient: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.18) 0%, rgba(79, 70, 229, 0.14) 45%, rgba(5, 7, 17, 0.98) 75%)',
    presentationBg: 'bg-[#04050D]',
    patternClass: 'pattern-cosmic-horizon',
    overlayOpacity: 0.5,
  },
  accentColors: {
    primary: '#06b6d4',
    secondary: '#818cf8',
    glow: 'rgba(6, 182, 212, 0.28)',
    border: 'rgba(6, 182, 212, 0.4)',
    badgeBg: 'rgba(8, 47, 73, 0.55)',
    badgeBorder: 'rgba(6, 182, 212, 0.35)',
    badgeText: '#67e8f9',
  },
  typography: {
    titleClass: 'font-black tracking-tight text-white leading-tight text-xl sm:text-2xl',
    descriptionClass: 'font-mono text-xs sm:text-sm text-cyan-200/75',
    badgeClass: 'font-mono text-[10px] font-bold text-cyan-300 uppercase tracking-widest',
    labelClass: 'font-sans text-sm font-semibold text-cyan-50',
    metricClass: 'font-mono text-2xl font-black text-cyan-300',
  },
  surface: {
    cardRounded: 'rounded-2xl',
    cardBorder: 'border-cyan-500/25',
    cardBg: 'bg-[#080E1B]/90',
    cardLeading: 'border-cyan-400/80 bg-[#0C1629] shadow-[0_0_35px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/60',
    cardSelected: 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-2 ring-cyan-400',
    surfaceShadow: 'shadow-[0_0_50px_rgba(6,182,212,0.12)]',
    divider: 'border-cyan-500/20',
  },
  animation: {
    intensity: 'cinematic',
    pulseFrequencySeconds: 0.75,
    pulseScalePeak: 1.10,
    pulseRhythm: 'standard',
    rippleSpeed: '1.5s',
  },
  visualDetails: {
    primaryIcon: 'Globe',
    personalityBadge: 'CONFERENCE · KEYNOTE AUDITORIUM',
    statusIndicator: 'Main Stage Auditorium Hall A',
    specialWidget: 'none',
    widgetLabel: 'STAGE BROADCAST',
    widgetText: '4K Auditorium Feed Active',
  },
  presentation: {
    stageBackdrop: 'bg-[#04050D]',
    headerBadge: 'MAIN STAGE KEYNOTE',
    titleSize: 'text-3xl sm:text-6xl font-black tracking-tight text-white',
    qrBadgeStyle: 'border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    layoutArchetype: 'keynote',
  },
  nodeBaseSize: 36,
  nodeGrowthFactor: 38,
  palette: [
    { id: 'cf1', label: 'Option A', border: 'rgba(6, 182, 212, 0.5)', text: '#22d3ee', glow: 'rgba(6, 182, 212, 0.25)', bg: 'rgba(6, 182, 212, 0.08)', accent: '#06b6d4', barColor: '#06b6d4' },
    { id: 'cf2', label: 'Option B', border: 'rgba(129, 140, 248, 0.5)', text: '#a5b4fc', glow: 'rgba(129, 140, 248, 0.25)', bg: 'rgba(129, 140, 248, 0.08)', accent: '#818cf8', barColor: '#818cf8' },
    { id: 'cf3', label: 'Option C', border: 'rgba(56, 189, 248, 0.5)', text: '#38bdf8', glow: 'rgba(56, 189, 248, 0.25)', bg: 'rgba(56, 189, 248, 0.08)', accent: '#0284c7', barColor: '#0284c7' },
    { id: 'cf4', label: 'Option D', border: 'rgba(45, 212, 191, 0.5)', text: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.25)', bg: 'rgba(45, 212, 191, 0.08)', accent: '#14b8a6', barColor: '#14b8a6' },
  ],
  leadPalette: {
    border: 'rgba(6, 182, 212, 0.7)',
    text: '#a5f3fc',
    glow: 'rgba(6, 182, 212, 0.35)',
    bg: 'rgba(8, 47, 73, 0.3)',
    badgeBg: 'rgba(4, 25, 40, 0.85)',
    badgeBorder: 'rgba(6, 182, 212, 0.45)',
  },
  cssVariables: {
    '--pulse-primary-color': '#06b6d4',
    '--pulse-secondary-color': '#818cf8',
    '--pulse-theme-glow': 'rgba(6, 182, 212, 0.28)',
    '--pulse-theme-border': 'rgba(6, 182, 212, 0.4)',
    '--pulse-node-core-size': '36px',
    '--pulse-frequency': '0.75s',
    '--pulse-wave-speed': '1.5s',
  },
  tailwindClasses: {
    containerBorder: 'border-cyan-500/25',
    containerGlow: 'shadow-[0_0_50px_rgba(6,182,212,0.1)]',
    gridBg: 'bg-[#050711]',
    cardBorder: 'border-cyan-500/18',
    cardBg: 'bg-[#080E1B]/90',
    cardLeading: 'border-cyan-400/80 bg-[#0C1629] shadow-[0_0_30px_rgba(6,182,212,0.2)]',
    cardSelected: 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400',
    badge: 'border-cyan-500/30 bg-cyan-950/50 text-cyan-300 font-bold',
    progressBarBg: '#06b6d4',
    accentText: 'text-cyan-400',
  },
};

// ---------------------------------------------------------------------------
// Lookup & Registration
// ---------------------------------------------------------------------------
export const ALL_PERSONALITY_THEMES: Record<EventPersonalityType, PulseTheme> = {
  classroom: THEME_CLASSROOM,
  'team-work': THEME_TEAM_WORK,
  'live-event': THEME_LIVE_EVENT,
  quiz: THEME_QUIZ,
  competition: THEME_COMPETITION,
  brainstorm: THEME_BRAINSTORM,
  'party-social': THEME_PARTY_SOCIAL,
  survey: THEME_SURVEY,
  conference: THEME_CONFERENCE,
};

export const ALL_THEMES: PulseTheme[] = Object.values(ALL_PERSONALITY_THEMES);

export const THEME_DEFAULT_ECLIPSE: PulseTheme = THEME_CONFERENCE;

/**
 * Resolves a theme given an EventPersonalityType.
 */
export function getThemeForPersonality(personality: EventPersonalityType): PulseTheme {
  return ALL_PERSONALITY_THEMES[personality] || THEME_CONFERENCE;
}

/**
 * Resolves a theme for a template ID.
 */
export function getThemeForTemplate(templateId: string): PulseTheme {
  if (templateId.startsWith('classroom')) return THEME_CLASSROOM;
  if (templateId.startsWith('team')) return THEME_TEAM_WORK;
  if (templateId.startsWith('live')) return THEME_LIVE_EVENT;
  if (templateId.startsWith('quiz')) return THEME_QUIZ;
  if (templateId.startsWith('competition')) return THEME_COMPETITION;
  if (templateId.startsWith('brainstorm')) return THEME_BRAINSTORM;
  if (templateId.startsWith('party')) return THEME_PARTY_SOCIAL;
  if (templateId.startsWith('survey')) return THEME_SURVEY;
  if (templateId.startsWith('conf')) return THEME_CONFERENCE;

  // Fallback heuristic on template names
  const idLower = templateId.toLowerCase();
  if (idLower.includes('classroom') || idLower.includes('pacing')) return THEME_CLASSROOM;
  if (idLower.includes('retro') || idLower.includes('strategy') || idLower.includes('team')) return THEME_TEAM_WORK;
  if (idLower.includes('anthem') || idLower.includes('encore') || idLower.includes('live')) return THEME_LIVE_EVENT;
  if (idLower.includes('quiz') || idLower.includes('trivia')) return THEME_QUIZ;
  if (idLower.includes('hackathon') || idLower.includes('pitch') || idLower.includes('competition')) return THEME_COMPETITION;
  if (idLower.includes('design') || idLower.includes('naming') || idLower.includes('brainstorm')) return THEME_BRAINSTORM;
  if (idLower.includes('social') || idLower.includes('award') || idLower.includes('party')) return THEME_PARTY_SOCIAL;
  if (idLower.includes('benchmark') || idLower.includes('survey')) return THEME_SURVEY;
  if (idLower.includes('conf') || idLower.includes('keynote') || idLower.includes('icebreaker')) return THEME_CONFERENCE;

  return THEME_CONFERENCE;
}

/**
 * Master Resolver for any Poll or Creator form input.
 */
export function getThemeForPoll(poll: {
  template_id?: string;
  theme_id?: string;
  personality?: string;
  title?: string;
  description?: string;
}): PulseTheme {
  // 1. Explicit theme_id
  if (poll.theme_id) {
    const found = ALL_THEMES.find((t) => t.id === poll.theme_id);
    if (found) return found;
  }

  // 2. Explicit personality
  if (poll.personality && poll.personality in ALL_PERSONALITY_THEMES) {
    return ALL_PERSONALITY_THEMES[poll.personality as EventPersonalityType];
  }

  // 3. Explicit template_id
  if (poll.template_id) {
    return getThemeForTemplate(poll.template_id);
  }

  // 4. Keyword heuristic matching against titles & descriptions
  const text = `${poll.title || ''} ${poll.description || ''}`.toLowerCase();
  if (text.includes('classroom') || text.includes('comprehension') || text.includes('lecture') || text.includes('student')) {
    return THEME_CLASSROOM;
  }
  if (text.includes('retro') || text.includes('workstream') || text.includes('team') || text.includes('okr') || text.includes('sprint')) {
    return THEME_TEAM_WORK;
  }
  if (text.includes('dj') || text.includes('concert') || text.includes('encore') || text.includes('decibel') || text.includes('anthem') || text.includes('stadium')) {
    return THEME_LIVE_EVENT;
  }
  if (text.includes('trivia') || text.includes('quiz') || text.includes('countdown') || text.includes('knowledge sprint')) {
    return THEME_QUIZ;
  }
  if (text.includes('hackathon') || text.includes('championship') || text.includes('pitch') || text.includes('founder') || text.includes('tournament')) {
    return THEME_COMPETITION;
  }
  if (text.includes('brainstorm') || text.includes('sprint') || text.includes('design') || text.includes('identity') || text.includes('metaphor')) {
    return THEME_BRAINSTORM;
  }
  if (text.includes('celebration') || text.includes('happy hour') || text.includes('social') || text.includes('toast') || text.includes('party') || text.includes('award')) {
    return THEME_PARTY_SOCIAL;
  }
  if (text.includes('survey') || text.includes('benchmark') || text.includes('empirical') || text.includes('runtime') || text.includes('developer experience')) {
    return THEME_SURVEY;
  }
  if (text.includes('keynote') || text.includes('dialed in') || text.includes('auditorium') || text.includes('conference')) {
    return THEME_CONFERENCE;
  }

  return THEME_CONFERENCE;
}

/**
 * Injects CSS variables onto an element.
 */
export function applyThemeCSSVariables(theme: PulseTheme, targetElement?: HTMLElement): void {
  if (typeof document === 'undefined') return;
  const el = targetElement || document.documentElement;
  for (const [prop, val] of Object.entries(theme.cssVariables)) {
    el.style.setProperty(prop, val);
  }
}

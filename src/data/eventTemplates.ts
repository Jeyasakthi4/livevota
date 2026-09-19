import { EventTemplate, EventPersonalityType } from '../types';

export interface EventPersonalityMeta {
  id: EventPersonalityType;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  accent: string;
  iconName: string;
}

export const EVENT_PERSONALITIES: Record<EventPersonalityType, EventPersonalityMeta> = {
  classroom: {
    id: 'classroom',
    name: 'CLASSROOM',
    badge: 'Academic',
    tagline: 'Soft academic environment, calm blue tones',
    description: 'Soft academic environment, subtle notebook/grid texture, calm blue tones, clean educational feel.',
    accent: '#3b82f6',
    iconName: 'GraduationCap',
  },
  'team-work': {
    id: 'team-work',
    name: 'TEAM / WORK',
    badge: 'Professional',
    tagline: 'Professional, sophisticated, minimal',
    description: 'Executive obsidian surfaces, tight tracking typography, minimal distraction, razor precision.',
    accent: '#3b82f6',
    iconName: 'Briefcase',
  },
  'live-event': {
    id: 'live-event',
    name: 'LIVE EVENT',
    badge: 'Concert & Arena',
    tagline: 'Energetic, large typography, stronger realtime pulses',
    description: 'Concert stage lighting, massive display typography, high-voltage pulses and decibel ripples.',
    accent: '#ec4899',
    iconName: 'Zap',
  },
  quiz: {
    id: 'quiz',
    name: 'QUIZ',
    badge: 'Trivia & Timed',
    tagline: 'Interactive, countdown-focused, engaging',
    description: 'Interactive countdown timer widget, game-show bouncy letters, vivid gold/purple highlights.',
    accent: '#f59e0b',
    iconName: 'Timer',
  },
  competition: {
    id: 'competition',
    name: 'COMPETITION',
    badge: 'Leaderboard',
    tagline: 'Bold, dynamic, results-focused',
    description: 'Race-track vermilion, athletic bold display, real-time leaderboard ranking and winner crowns.',
    accent: '#ef4444',
    iconName: 'Trophy',
  },
  brainstorm: {
    id: 'brainstorm',
    name: 'BRAINSTORM',
    badge: 'Creative Studio',
    tagline: 'Creative, editorial, idea-focused',
    description: 'Lavender mind-map aurora, editorial typography, gentle fluid floating orbital motion.',
    accent: '#c084fc',
    iconName: 'Lightbulb',
  },
  'party-social': {
    id: 'party-social',
    name: 'PARTY / SOCIAL',
    badge: 'Celebration',
    tagline: 'Expressive and celebratory but still premium',
    description: 'Midnight champagne glow, festive celebratory particles, warm playful typography and crowd vibe.',
    accent: '#f43f5e',
    iconName: 'PartyPopper',
  },
  survey: {
    id: 'survey',
    name: 'SURVEY',
    badge: 'Data & Metrics',
    tagline: 'Minimal, clean, data-focused',
    description: 'Clinical radar grid, high-density monospace statistical figures, razor-thin progress bars.',
    accent: '#14b8a6',
    iconName: 'BarChart2',
  },
  conference: {
    id: 'conference',
    name: 'CONFERENCE',
    badge: 'Keynote & Stage',
    tagline: 'Futuristic, premium, presentation-friendly',
    description: 'Cosmic orbital horizon, futuristic cyan glow, keynote presentation display layout.',
    accent: '#06b6d4',
    iconName: 'Globe',
  },
};

export const EVENT_CATEGORIES = [
  { id: 'all', label: 'All Personalities', personality: null },
  { id: 'classroom', label: 'Classroom', personality: 'classroom' as EventPersonalityType },
  { id: 'team-work', label: 'Team / Work', personality: 'team-work' as EventPersonalityType },
  { id: 'live-event', label: 'Live Event', personality: 'live-event' as EventPersonalityType },
  { id: 'quiz', label: 'Quiz', personality: 'quiz' as EventPersonalityType },
  { id: 'competition', label: 'Competition', personality: 'competition' as EventPersonalityType },
  { id: 'brainstorm', label: 'Brainstorm', personality: 'brainstorm' as EventPersonalityType },
  { id: 'party-social', label: 'Party / Social', personality: 'party-social' as EventPersonalityType },
  { id: 'survey', label: 'Survey', personality: 'survey' as EventPersonalityType },
  { id: 'conference', label: 'Conference', personality: 'conference' as EventPersonalityType },
] as const;

export const EVENT_TEMPLATES: EventTemplate[] = [
  // 1. CLASSROOM — clean, educational, calm
  {
    id: 'classroom-comprehension',
    personality: 'classroom',
    personalityLabel: 'CLASSROOM',
    category: 'classroom',
    categoryLabel: 'Classroom',
    badge: 'Lecture Comprehension',
    title: 'Which architectural principle requires deep-dive review before today’s lab?',
    description: 'Educational concept check: gauges student comprehension in real-time without disrupting lecture cadence.',
    options: [
      'Distributed Consensus (Raft & Paxos)',
      'Event-Driven Idempotency & Retries',
      'Memory Management & Garbage Collection',
      'Fully confident — ready for hands-on code',
    ],
    recommendedMinutes: 5,
    tagline: 'Soft academic environment, subtle notebook/grid texture, calm blue tones',
  },

  // 2. TEAM / WORK — professional, sophisticated, minimal
  {
    id: 'team-retro-focus',
    personality: 'team-work',
    personalityLabel: 'TEAM / WORK',
    category: 'team-work',
    categoryLabel: 'Team / Work',
    badge: 'Sprint Retrospective',
    title: 'Where should engineering leadership direct focus for the upcoming cycle?',
    description: 'Executive sprint retrospective discovery: align team velocity and eliminate technical friction.',
    options: [
      'Automated Test Flakiness & CI Bottlenecks',
      'Database Connection Limits & Query Latency',
      'Monolithic Inter-Team Service Dependencies',
      'Developer Environment & Infrastructure Toil',
    ],
    recommendedMinutes: 15,
    tagline: 'Sophisticated office-inspired background, subtle geometric architecture, dark professional tones',
  },

  // 3. LIVE EVENT — energetic, large typography, stronger realtime pulses
  {
    id: 'live-stadium-anthem',
    personality: 'live-event',
    personalityLabel: 'LIVE EVENT',
    category: 'live-event',
    categoryLabel: 'Live Event',
    badge: 'Concert & Arena',
    title: 'WHICH ANTHEM TRACK SHOULD THE DJ DROP FOR THE HEADLINER SET?',
    description: 'Stadium decibel vote: live crowd momentum steers lighting rigs and sound stages in real-time.',
    options: [
      'NEON CYBERPUNK SYNTHWAVE',
      'DEEP ACID BASSLINE ANTHEM',
      'ELECTRIC DRUM & BASS VIP',
      'RETRO 80S HIGH-ENERGY REMIX',
    ],
    recommendedMinutes: 3,
    tagline: 'Energetic stage atmosphere, subtle spotlights, dynamic light beams, audience/event ambience',
  },

  // 4. QUIZ — interactive, countdown-focused, engaging
  {
    id: 'quiz-distributed-trivia',
    personality: 'quiz',
    personalityLabel: 'QUIZ',
    category: 'quiz',
    categoryLabel: 'Quiz',
    badge: 'Speed Trivia Arena',
    title: 'Trivia Challenge: Which mechanism guarantees serializable isolation across database replicas?',
    description: 'Rapid countdown round: lock in your answer before the 45-second buzzer expires to score maximum points.',
    options: [
      'Two-Phase Commit with Strict 2PL (Two-Phase Locking)',
      'Optimistic Concurrency Control (OCC) with Commit Validation',
      'Lamport Logical Timestamps & Vector Clocks',
      'Read-Committed Snapshot Isolation without Locks',
    ],
    recommendedMinutes: 1,
    tagline: 'Playful knowledge-game atmosphere, subtle question marks, floating symbols, interactive competition feel',
  },

  // 5. COMPETITION — bold, dynamic, results-focused
  {
    id: 'competition-hackathon-finals',
    personality: 'competition',
    personalityLabel: 'COMPETITION',
    category: 'competition',
    categoryLabel: 'Competition',
    badge: 'Championship Finals',
    title: 'GRAND FINALS: CAST YOUR VOTE FOR THE 2026 OVERALL HACKATHON CHAMPION',
    description: 'Live tournament battle: audience votes update podium positions and crown the winners live on stage.',
    options: [
      'Team Apex: Autonomous Edge Mesh Telemetry',
      'Team Neural: Real-Time Code Review Synthesizer',
      'Team Vault: Zero-Knowledge Privacy Protocol',
      'Team Quantum: Microsecond Vector State Engine',
    ],
    recommendedMinutes: 5,
    tagline: 'Bold stadium/arena-inspired atmosphere, dramatic lighting, dynamic motion accents',
  },

  // 6. BRAINSTORM — creative, editorial, idea-focused
  {
    id: 'brainstorm-design-sprint',
    personality: 'brainstorm',
    personalityLabel: 'BRAINSTORM',
    category: 'brainstorm',
    categoryLabel: 'Brainstorm',
    badge: 'Creative Studio Horizon',
    title: 'Which breakthrough product metaphor best encapsulates our 2027 user experience vision?',
    description: 'Creative studio exploration: cluster emergent concepts, organic ideas, and atmospheric metaphors.',
    options: [
      'Orbital Constellations & Gravitational Nodes',
      'Spatial Glassmorphic Cards & Ambient Light',
      'Tactile Monospaced Brutalist Precision',
      'Organic Living Canvas with Fluid Data Currents',
    ],
    recommendedMinutes: 15,
    tagline: 'Creative workspace atmosphere, subtle floating ideas, sketches, connecting lines and thought bubbles',
  },

  // 7. PARTY / SOCIAL — expressive and celebratory but still premium
  {
    id: 'party-friday-social',
    personality: 'party-social',
    personalityLabel: 'PARTY / SOCIAL',
    category: 'party-social',
    categoryLabel: 'Party / Social',
    badge: 'Celebration Gala',
    title: 'Team Milestone Gala: What was our single most legendary team accomplishment this year?',
    description: 'Midnight champagne vibes: celebrate major company milestones, crowd cheers, and toast peer victories.',
    options: [
      'Zero-downtime multi-region V1.0 launch',
      'The legendary 3-day mountain retreat hackathon',
      'Surpassing 10,000,000 live audience telemetry pulses',
      'Surviving the high-speed Mongo-to-Redis migration',
    ],
    recommendedMinutes: 10,
    tagline: 'Celebratory atmosphere with elegant confetti, soft bokeh and dynamic festive lighting',
  },

  // 8. SURVEY — minimal, clean, data-focused
  {
    id: 'survey-runtime-benchmark',
    personality: 'survey',
    personalityLabel: 'SURVEY',
    category: 'survey',
    categoryLabel: 'Survey',
    badge: 'Empirical Telemetry Matrix',
    title: 'Benchmark Survey: Which runtime does your organization standardize for high-throughput APIs?',
    description: 'Clinical empirical study: quantitative adoption metrics across enterprise systems with strict confidence bounds.',
    options: [
      'Go (Gin / Fiber + Lightweight Goroutines)',
      'Node.js / TypeScript (Fastify / Express + Event Loop)',
      'Rust (Axum / Tokio / Actix Multi-Threaded)',
      'Python (FastAPI / uvloop / AsyncIO Engine)',
    ],
    recommendedMinutes: 10,
    tagline: 'Clean research/data atmosphere with subtle grids, dots and analytical patterns',
  },

  // 9. CONFERENCE — futuristic, premium, presentation-friendly
  {
    id: 'conf-keynote-direction',
    personality: 'conference',
    personalityLabel: 'CONFERENCE',
    category: 'conference',
    categoryLabel: 'Conference',
    badge: 'Keynote Main Stage',
    title: 'Auditorium Live Steering: Which core technical domain should our keynote speaker unpack first?',
    description: 'Main stage interactive steering: 4K auditorium displays dynamically reflect thousands of attendee votes live.',
    options: [
      'Agentic Autonomous AI Workflows in Production',
      'High-Throughput Distributed Microservice Architecture',
      'Developer Velocity, Ergonomics & Modern Tooling',
      'Zero-Downtime Reliability, Chaos Engineering & Failover',
    ],
    recommendedMinutes: 10,
    tagline: 'Premium futuristic conference atmosphere with abstract stage geometry and sophisticated lighting',
  },
];

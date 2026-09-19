import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Zap,
  Timer,
  Trophy,
  Lightbulb,
  PartyPopper,
  BarChart2,
  Globe,
  Layers,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { EventTemplate, EventPersonalityType } from '../types';
import { EVENT_CATEGORIES, EVENT_TEMPLATES } from '../data/eventTemplates';
import { sounds } from '../utils/soundEffects';
import { getThemeForTemplate } from '../utils/themeManager';
import { ThemedEventBackground } from './ThemedEventBackground';

interface EventTemplatesSectionProps {
  onSelectTemplate: (template: EventTemplate) => void;
  activeAtmosphere?: EventPersonalityType;
  onSelectAtmosphere?: (personality: EventPersonalityType) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Layers,
  classroom: GraduationCap,
  'team-work': Briefcase,
  'live-event': Zap,
  quiz: Timer,
  competition: Trophy,
  brainstorm: Lightbulb,
  'party-social': PartyPopper,
  survey: BarChart2,
  conference: Globe,
};

const ATMOSPHERE_HIGHLIGHTS: Record<
  EventPersonalityType,
  { atmosphere: string; elements: string }
> = {
  classroom: {
    atmosphere: 'Soft academic environment, calm blue tones',
    elements: 'Notebook ruled lines, graph grid & floating motes',
  },
  'team-work': {
    atmosphere: 'Sophisticated office-inspired, dark professional tones',
    elements: 'Geometric architectural lines & scanning laser axis',
  },
  'live-event': {
    atmosphere: 'Energetic stage atmosphere & concert dark',
    elements: 'Dynamic dual stage spotlights & soundwave ripples',
  },
  quiz: {
    atmosphere: 'Playful knowledge-game arena & deep violet',
    elements: 'Floating question marks (?), sparks (✦) & buzzer spotlight',
  },
  competition: {
    atmosphere: 'Bold stadium/arena, race carbon & vermilion',
    elements: 'Twin stadium floodlights & 45° speed chevrons',
  },
  brainstorm: {
    atmosphere: 'Creative workspace, studio twilight & lavender/mint',
    elements: 'Mind-map vector links, sketch cards & thought bubbles',
  },
  'party-social': {
    atmosphere: 'Celebratory gala vibe, velvet midnight & rose',
    elements: 'Drifting champagne confetti & layered soft bokeh',
  },
  survey: {
    atmosphere: 'Clean research/data atmosphere & clinical cyan slate',
    elements: 'Cartesian coordinate grid & oscilloscope wave scan',
  },
  conference: {
    atmosphere: 'Premium futuristic conference, keynote cosmic indigo',
    elements: '3D perspective stage geometry & projector horizon beam',
  },
};

const EVENT_WIDGET_SPECS: Record<
  EventPersonalityType,
  {
    icon: React.ElementType;
    label: string;
    sublabel: string;
    simulatedShares: [number, number, number];
    badgeTone: string;
  }
> = {
  classroom: {
    icon: GraduationCap,
    label: 'ACADEMIC LECTURE HUD',
    sublabel: 'Cohort Comprehension Synchronized',
    simulatedShares: [58, 26, 16],
    badgeTone: 'Calm Notebook Blue',
  },
  'team-work': {
    icon: Briefcase,
    label: 'EXECUTIVE PRECISION RETRO',
    sublabel: 'Confidential Engineering Consensus',
    simulatedShares: [44, 38, 18],
    badgeTone: 'Obsidian & Hairline Sapphire',
  },
  'live-event': {
    icon: Zap,
    label: 'STADIUM SOUND STAGE',
    sublabel: 'Live Decibel Surge · 98.4 dB Wave',
    simulatedShares: [62, 23, 15],
    badgeTone: 'High-Voltage Neon & Ultraviolet',
  },
  quiz: {
    icon: Timer,
    label: 'SPEED TRIVIA ARENA',
    sublabel: '⏱ 00:45 Buzzer Round Active',
    simulatedShares: [51, 31, 18],
    badgeTone: 'Gameshow Gold & Electric Violet',
  },
  competition: {
    icon: Trophy,
    label: 'CHAMPIONSHIP PODIUM RACE',
    sublabel: '🏆 Realtime Leaderboard Shift',
    simulatedShares: [49, 33, 18],
    badgeTone: 'Race Vermilion & Athletic Gold',
  },
  brainstorm: {
    icon: Lightbulb,
    label: 'CREATIVE STUDIO HORIZON',
    sublabel: 'Organic Concept Cluster Floating',
    simulatedShares: [42, 35, 23],
    badgeTone: 'Lavender Nebula & Mint Aura',
  },
  'party-social': {
    icon: PartyPopper,
    label: 'CELEBRATION GALA VIBE',
    sublabel: '🎉 Midnight Toasts & Crowd Cheers',
    simulatedShares: [55, 27, 18],
    badgeTone: 'Champagne Rose & Disco Glow',
  },
  survey: {
    icon: BarChart2,
    label: 'EMPIRICAL MATRIX TELEMETRY',
    sublabel: 'Quantitative Metrics · CI 95%',
    simulatedShares: [46, 32, 22],
    badgeTone: 'Clinical Teal Radar Grid',
  },
  conference: {
    icon: Globe,
    label: 'KEYNOTE AUDITORIUM BROADCAST',
    sublabel: 'Main Stage 4K Live Audience Feed',
    simulatedShares: [54, 29, 17],
    badgeTone: 'Futuristic Cosmic Cyan Horizon',
  },
};

export const EventTemplatesSection: React.FC<EventTemplatesSectionProps> = ({
  onSelectTemplate,
  activeAtmosphere = 'conference',
  onSelectAtmosphere,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates =
    selectedCategory === 'all'
      ? EVENT_TEMPLATES
      : EVENT_TEMPLATES.filter(
          (t) => t.personality === selectedCategory || t.category === selectedCategory
        );

  const handleUseTemplate = (template: EventTemplate) => {
    sounds.playSelect();
    onSelectAtmosphere?.(template.personality);
    onSelectTemplate(template);
  };

  const handleActivateAtmosphere = (
    e: React.MouseEvent,
    personality: EventPersonalityType
  ) => {
    e.stopPropagation();
    sounds.playSelect();
    onSelectAtmosphere?.(personality);
  };

  return (
    <section
      id="event-templates-section"
      className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              9 EVENT PERSONALITIES · SIGNATURE ATMOSPHERES
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Event Templates & Atmospheric Backgrounds
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Every template features a distinct, event-specific background atmosphere with bespoke
            textures, custom lighting, and subtle animations that persist into live poll rooms and Presentation Mode.
          </p>
        </div>

        {/* Live Atmosphere Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-[11px] font-mono">
            <span className="text-zinc-500">PAGE ATMOSPHERE: </span>
            <span className="font-bold text-white uppercase tracking-wider">
              {activeAtmosphere}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter & Instant Atmosphere Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar scroll-smooth">
        {EVENT_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Layers;
          const isFilterActive = selectedCategory === cat.id;
          const isAtmosphereActive = cat.personality && activeAtmosphere === cat.personality;

          return (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playSelect();
                setSelectedCategory(cat.id);
                if (cat.personality) {
                  onSelectAtmosphere?.(cat.personality);
                }
              }}
              className={`flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 ease-out cursor-pointer select-none active:scale-[0.96] ${
                isFilterActive
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'border border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white'
              }`}
              id={`template-filter-${cat.id}`}
            >
              <Icon className={`h-3.5 w-3.5 ${isFilterActive ? 'text-black' : 'text-zinc-400'}`} />
              <span>{cat.label}</span>
              {isAtmosphereActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Template Cards Grid with Event Design Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const theme = getThemeForTemplate(template.id);
          const IconComponent = CATEGORY_ICONS[template.personality] || Sparkles;
          const widgetSpec = EVENT_WIDGET_SPECS[template.personality] || {
            icon: Sparkles,
            label: 'LIVE EVENT POLL',
            sublabel: 'Audience Pulse Synchronized',
            simulatedShares: [50, 30, 20],
            badgeTone: 'Default Theme',
          };
          const WidgetIcon = widgetSpec.icon;
          const highlight = ATMOSPHERE_HIGHLIGHTS[template.personality] || {
            atmosphere: template.tagline,
            elements: 'Bespoke event atmosphere',
          };
          const isPageAtmosphere = activeAtmosphere === template.personality;

          return (
            <div
              key={template.id}
              onClick={() => {
                onSelectAtmosphere?.(template.personality);
              }}
              style={{
                borderColor: isPageAtmosphere
                  ? theme.accentColors?.primary || '#38bdf8'
                  : theme.accentColors?.border || 'rgba(255,255,255,0.08)',
              }}
              className={`group relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 shadow-xl overflow-hidden cursor-pointer hover:scale-[1.01] hover:shadow-2xl ${
                isPageAtmosphere
                  ? 'ring-2 ring-offset-2 ring-offset-[#07080B] ring-cyan-500/50'
                  : ''
              }`}
            >
              {/* Event-Specific Background Atmosphere */}
              <ThemedEventBackground
                personality={template.personality}
                theme={theme}
                variant="card"
                opacity={0.8}
              />

              {/* Themed Ambient Atmospheric Glow */}
              <div
                className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
                style={{ background: theme.atmosphere?.previewGradient }}
              />

              <div className="relative z-10 space-y-4">
                {/* Top Meta Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Event Personality Badge */}
                  <span
                    className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 shadow-sm"
                    style={{
                      backgroundColor: theme.accentColors?.badgeBg,
                      borderColor: theme.accentColors?.badgeBorder,
                      color: theme.accentColors?.badgeText,
                    }}
                  >
                    <IconComponent className="h-3 w-3" />
                    <span>{template.personalityLabel}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Active Atmosphere Badge */}
                    {isPageAtmosphere ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md font-semibold">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Active Page Atmosphere</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleActivateAtmosphere(e, template.personality)}
                        className="flex items-center gap-1 text-[10px] font-mono text-zinc-300 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-2 py-0.5 rounded-md transition"
                        title="Set as active page atmosphere"
                      >
                        <Eye className="h-3 w-3 text-cyan-400" />
                        <span>Preview Atmosphere</span>
                      </button>
                    )}

                    {/* Time recommendation */}
                    {template.recommendedMinutes && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-md">
                        <Clock className="h-3 w-3 text-zinc-400" />
                        <span>{template.recommendedMinutes}m</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Poll Question Title & Atmosphere Description */}
                <div className="space-y-1.5">
                  <h3
                    className="text-base font-bold text-white group-hover:text-white transition line-clamp-2 leading-snug"
                    style={{
                      letterSpacing:
                        template.personality === 'live-event' ? '0.04em' : 'normal',
                    }}
                  >
                    {template.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Atmosphere Features Highlight */}
                <div className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-[11px] space-y-1 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-zinc-300 font-medium">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                      Atmosphere
                    </span>
                    <span className="text-[10px] text-zinc-400">{highlight.elements}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    {highlight.atmosphere}
                  </p>
                </div>

                {/* THEME & DESIGN PREVIEW MOCKUP */}
                <div className="relative rounded-xl border border-white/[0.12] bg-black/60 p-3.5 space-y-3 backdrop-blur-md shadow-inner overflow-hidden">
                  <ThemedEventBackground
                    personality={template.personality}
                    theme={theme}
                    variant="inset"
                    opacity={0.5}
                  />

                  <div className="relative z-10 space-y-3">
                    {/* Event Widget Header */}
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <WidgetIcon
                          className="h-3 w-3"
                          style={{ color: theme.accentColors?.primary || '#38bdf8' }}
                        />
                        <span className="font-bold text-zinc-200">{widgetSpec.label}</span>
                      </div>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                        style={{
                          backgroundColor: theme.accentColors?.badgeBg,
                          color: theme.accentColors?.badgeText,
                        }}
                      >
                        {widgetSpec.badgeTone}
                      </span>
                    </div>

                    {/* Themed Simulated Progress Options */}
                    <div className="space-y-2">
                      {template.options.slice(0, 3).map((opt, idx) => {
                        const share = widgetSpec.simulatedShares[idx] ?? 20;
                        const paletteEntry = theme.palette[idx % theme.palette.length];
                        const isLeader = idx === 0;

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                <span
                                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded font-mono text-[9px] font-bold"
                                  style={{
                                    backgroundColor: isLeader
                                      ? paletteEntry.accent
                                      : 'rgba(255,255,255,0.08)',
                                    color: isLeader ? '#000000' : '#d4d4d8',
                                  }}
                                >
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="truncate text-zinc-300 font-medium">{opt}</span>
                              </div>
                              <span
                                className="font-mono text-[10px] font-bold shrink-0"
                                style={{ color: isLeader ? paletteEntry.accent : '#a1a1aa' }}
                              >
                                {share}%
                              </span>
                            </div>

                            {/* Themed Progress Fill Bar */}
                            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${share}%`,
                                  backgroundColor: paletteEntry.accent,
                                  boxShadow: isLeader
                                    ? `0 0 10px ${paletteEntry.accent}80`
                                    : 'none',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Micro Pulse Indicators */}
                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full animate-ping"
                          style={{
                            backgroundColor: theme.accentColors?.primary || '#38bdf8',
                          }}
                        />
                        <span>{widgetSpec.sublabel}</span>
                      </div>
                      <span className="text-[9px] text-zinc-400 font-mono capitalize">
                        {theme.animation.intensity} rhythm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Theme Visual Palette Swatches */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-400">Palette:</span>
                    <div className="flex -space-x-1 items-center">
                      {theme.palette.map((p, i) => (
                        <span
                          key={i}
                          className="h-3 w-3 rounded-full border border-black/80 shadow-sm"
                          style={{ backgroundColor: p.accent }}
                          title={`${p.label} (${p.accent})`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 truncate">
                    {theme.name}
                  </span>
                </div>
              </div>

              {/* Bottom Launch Action Button */}
              <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[50%]">
                  {theme.personalityLabel}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseTemplate(template);
                  }}
                  style={{
                    backgroundColor: theme.accentColors?.primary || '#ffffff',
                    color: '#000000',
                  }}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold hover:brightness-110 active:scale-[0.98] transition cursor-pointer shadow-md"
                  id={`use-template-${template.id}`}
                >
                  <span>Launch Event Poll</span>
                  <ArrowRight className="h-3.5 w-3.5 text-black" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

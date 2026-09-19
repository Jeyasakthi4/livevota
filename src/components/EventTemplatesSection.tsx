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
} from 'lucide-react';
import { EventTemplate } from '../types';
import { EVENT_CATEGORIES, EVENT_TEMPLATES } from '../data/eventTemplates';
import { sounds } from '../utils/soundEffects';
import { getThemeForTemplate } from '../utils/themeManager';

interface EventTemplatesSectionProps {
  onSelectTemplate: (template: EventTemplate) => void;
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

export const EventTemplatesSection: React.FC<EventTemplatesSectionProps> = ({
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates =
    selectedCategory === 'all'
      ? EVENT_TEMPLATES
      : EVENT_TEMPLATES.filter((t) => t.personality === selectedCategory || t.category === selectedCategory);

  const handleUseTemplate = (template: EventTemplate) => {
    sounds.playSelect();
    onSelectTemplate(template);
  };

  return (
    <section id="event-templates-section" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              9 EVENT PERSONALITIES & CURATED BLUEPRINTS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Event Templates with Dynamic Theme Engines
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Each template controls background atmosphere, accent colors, typography emphasis, card surface treatments, Pulse Field physics, animation intensity, and presentation mode.
          </p>
        </div>

        <span className="text-xs font-mono text-zinc-400 self-start sm:self-auto">
          {filteredTemplates.length} templates
        </span>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {EVENT_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Layers;
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playSelect();
                setSelectedCategory(cat.id);
              }}
              className={`flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition cursor-pointer select-none ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'border border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:border-white/[0.14] hover:bg-white/[0.05]'
              }`}
              id={`template-filter-${cat.id}`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => {
          const theme = getThemeForTemplate(template.id);
          const IconComponent = CATEGORY_ICONS[template.personality] || Sparkles;

          return (
            <div
              key={template.id}
              style={{
                borderColor: theme.accentColors?.border || 'rgba(255,255,255,0.08)',
              }}
              className="group flex flex-col justify-between rounded-2xl border bg-[#0A0D14] p-6 hover:bg-[#0E121C] transition duration-200 shadow-md"
            >
              <div className="space-y-4">
                {/* Top Meta Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1"
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
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-md">
                      <span className="flex -space-x-1 items-center">
                        {theme.palette.slice(0, 3).map((p, i) => (
                          <span
                            key={i}
                            className="h-2 w-2 rounded-full border border-black"
                            style={{ backgroundColor: p.accent }}
                          />
                        ))}
                      </span>
                      <span className="text-zinc-300 font-medium ml-1">{theme.name}</span>
                    </span>

                    {template.recommendedMinutes && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                        <Clock className="h-3 w-3 text-zinc-400" />
                        <span>{template.recommendedMinutes}m</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition line-clamp-2 leading-snug">
                    {template.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Options Preview List */}
                <div className="space-y-1.5 pt-1">
                  {template.options.slice(0, 4).map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.015] px-2.5 py-1.5 text-xs text-zinc-300"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-semibold text-zinc-400 bg-white/[0.05]">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="truncate text-[11px] text-zinc-300">{opt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[55%]">
                  {theme.visualDetails?.personalityBadge}
                </span>

                <button
                  type="button"
                  onClick={() => handleUseTemplate(template)}
                  className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 active:scale-[0.98] transition cursor-pointer shadow-sm"
                  id={`use-template-${template.id}`}
                >
                  <span>Select & Preview</span>
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

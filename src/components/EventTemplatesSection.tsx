import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Timer,
  Trophy,
  Lightbulb,
  PartyPopper,
  BarChart2,
  Globe,
  GraduationCap,
  Briefcase,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { EventTemplate, EventPersonalityType } from '../types';
import { EVENT_CATEGORIES, EVENT_TEMPLATES } from '../data/eventTemplates';
import { sounds } from '../utils/soundEffects';
import { EventTemplateCard } from './EventTemplateCard';
import { smoothScrollHorizontal, smoothCenterChild } from '../utils/scrollUtils';

interface EventTemplatesSectionProps {
  onSelectTemplate: (template: EventTemplate) => void;
  activeAtmosphere?: EventPersonalityType;
  onSelectAtmosphere?: (personality: EventPersonalityType) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (catId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Layers,
  quiz: Timer,
  competition: Trophy,
  brainstorm: Lightbulb,
  'party-social': PartyPopper,
  survey: BarChart2,
  conference: Globe,
  classroom: GraduationCap,
  'team-work': Briefcase,
  'live-event': Zap,
};

export const EventTemplatesSection: React.FC<EventTemplatesSectionProps> = ({
  onSelectTemplate,
  activeAtmosphere = 'quiz',
  onSelectAtmosphere,
  categoryFilter,
  onCategoryFilterChange,
}) => {
  const [internalCategory, setInternalCategory] = useState<string>('all');
  const categoriesContainerRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categoryFilter !== undefined ? categoryFilter : internalCategory;

  const handleSelectCategory = (catId: string, element?: HTMLElement) => {
    sounds.playSelect();
    if (onCategoryFilterChange) {
      onCategoryFilterChange(catId);
    } else {
      setInternalCategory(catId);
    }
    if (element && categoriesContainerRef.current) {
      smoothCenterChild(categoriesContainerRef.current, element);
    }
  };

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

  const handlePreviewAtmosphere = (personality: EventPersonalityType) => {
    sounds.playSelect();
    onSelectAtmosphere?.(personality);
  };

  return (
    <section
      id="event-templates-section"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300 font-semibold">
              SIGNATURE EVENT ATMOSPHERES · ZERO CONFIGURATION
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Event Templates & Atmospheric Personalities
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Every template visually communicates its event before you read the text. Handcrafted
            visual atmospheres, custom lighting, and responsive micro-animations that persist
            directly into your live poll room and presentation mode.
          </p>
        </div>

        {/* Live Atmosphere Indicator */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white/[0.04] border border-white/[0.1] px-3.5 py-2 rounded-xl backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <div className="text-[11px] font-mono">
            <span className="text-zinc-400">ACTIVE ATMOSPHERE: </span>
            <span className="font-bold text-white uppercase tracking-wider">
              {activeAtmosphere}
            </span>
          </div>
        </div>
      </div>

      {/* Atmosphere Switcher & Filter Pills with Smooth Scroll Navigation Chevrons */}
      <div className="relative flex items-center group/carousel">
        {/* Left Scroll Chevrons */}
        <button
          type="button"
          onClick={() => smoothScrollHorizontal(categoriesContainerRef.current, -220)}
          className="hidden sm:flex absolute -left-3 z-10 h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-[#0E1118]/90 text-zinc-300 shadow-lg backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 hover:text-white hover:border-white/[0.25] transition cursor-pointer"
          title="Smooth scroll left"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Categories Bar */}
        <div
          ref={categoriesContainerRef}
          className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar scroll-smooth w-full px-0.5"
        >
          {EVENT_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || Layers;
            const isFilterActive = selectedCategory === cat.id;
            const isAtmosphereActive = cat.personality && activeAtmosphere === cat.personality;

            return (
              <button
                key={cat.id}
                onClick={(e) => {
                  handleSelectCategory(cat.id, e.currentTarget);
                  if (cat.personality) {
                    onSelectAtmosphere?.(cat.personality);
                  }
                }}
                className={`flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 ease-out cursor-pointer select-none active:scale-[0.96] ${
                  isFilterActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'border border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white'
                }`}
                id={`template-filter-${cat.id}`}
              >
                <Icon className={`h-3.5 w-3.5 ${isFilterActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>{cat.label}</span>
                {isAtmosphereActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Chevrons */}
        <button
          type="button"
          onClick={() => smoothScrollHorizontal(categoriesContainerRef.current, 220)}
          className="hidden sm:flex absolute -right-3 z-10 h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-[#0E1118]/90 text-zinc-300 shadow-lg backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 hover:text-white hover:border-white/[0.25] transition cursor-pointer"
          title="Smooth scroll right"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Redesigned Atmospheric Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <EventTemplateCard
            key={template.id}
            template={template}
            isActiveAtmosphere={activeAtmosphere === template.personality}
            onPreviewAtmosphere={handlePreviewAtmosphere}
            onUseTemplate={handleUseTemplate}
          />
        ))}
      </div>
    </section>
  );
};

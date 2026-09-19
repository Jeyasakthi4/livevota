import React, { useState } from 'react';
import { ArrowRight, Eye, Check, Sparkles } from 'lucide-react';
import { EventTemplate, EventPersonalityType } from '../types';
import { QuizAtmospherePreview } from './templates/QuizAtmospherePreview';
import { CompetitionAtmospherePreview } from './templates/CompetitionAtmospherePreview';
import { BrainstormAtmospherePreview } from './templates/BrainstormAtmospherePreview';
import { PartySocialAtmospherePreview } from './templates/PartySocialAtmospherePreview';
import { SurveyAtmospherePreview } from './templates/SurveyAtmospherePreview';
import { ConferenceAtmospherePreview } from './templates/ConferenceAtmospherePreview';
import { GenericAtmospherePreview } from './templates/GenericAtmospherePreview';
import { getThemeForTemplate } from '../utils/themeManager';
import { sounds } from '../utils/soundEffects';

interface EventTemplateCardProps {
  template: EventTemplate;
  isActiveAtmosphere: boolean;
  onPreviewAtmosphere: (personality: EventPersonalityType) => void;
  onUseTemplate: (template: EventTemplate) => void;
}

export const EventTemplateCard: React.FC<EventTemplateCardProps> = ({
  template,
  isActiveAtmosphere,
  onPreviewAtmosphere,
  onUseTemplate,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const theme = getThemeForTemplate(template.id);

  // Template Display Metadata
  const displayName = template.displayName || template.personalityLabel;
  const shortDescription =
    template.shortDescription ||
    template.description.split('.')[0] + '.' ||
    'Immersive event atmosphere tailored for live audiences.';

  // Render the unique, event-specific atmosphere preview
  const renderAtmospherePreview = () => {
    switch (template.personality) {
      case 'quiz':
        return <QuizAtmospherePreview isHovered={isHovered} />;
      case 'competition':
        return <CompetitionAtmospherePreview isHovered={isHovered} />;
      case 'brainstorm':
        return <BrainstormAtmospherePreview isHovered={isHovered} />;
      case 'party-social':
        return <PartySocialAtmospherePreview isHovered={isHovered} />;
      case 'survey':
        return <SurveyAtmospherePreview isHovered={isHovered} />;
      case 'conference':
        return <ConferenceAtmospherePreview isHovered={isHovered} />;
      default:
        return (
          <GenericAtmospherePreview
            personality={template.personality}
            isHovered={isHovered}
          />
        );
    }
  };

  // Border and accent styling based on personality
  const getCardAccentStyles = () => {
    switch (template.personality) {
      case 'quiz':
        return {
          borderHover: 'hover:border-amber-400/50',
          glowHover: 'hover:shadow-[0_12px_36px_rgba(245,158,11,0.18)]',
          ctaBg: 'bg-gradient-to-r from-amber-400 to-amber-300 text-black hover:brightness-105',
          activeRing: 'ring-2 ring-amber-400/70 shadow-[0_0_24px_rgba(245,158,11,0.3)]',
          badgeText: 'text-amber-300',
        };
      case 'competition':
        return {
          borderHover: 'hover:border-red-500/60',
          glowHover: 'hover:shadow-[0_12px_36px_rgba(239,68,68,0.22)]',
          ctaBg: 'bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 text-black hover:brightness-105',
          activeRing: 'ring-2 ring-red-500/70 shadow-[0_0_24px_rgba(239,68,68,0.35)]',
          badgeText: 'text-red-400',
        };
      case 'brainstorm':
        return {
          borderHover: 'hover:border-purple-400/50',
          glowHover: 'hover:shadow-[0_12px_36px_rgba(168,85,247,0.18)]',
          ctaBg: 'bg-gradient-to-r from-purple-400 to-emerald-300 text-black hover:brightness-105',
          activeRing: 'ring-2 ring-purple-400/70 shadow-[0_0_24px_rgba(168,85,247,0.3)]',
          badgeText: 'text-purple-300',
        };
      case 'party-social':
        return {
          borderHover: 'hover:border-rose-400/50',
          glowHover: 'hover:shadow-[0_12px_36px_rgba(244,63,94,0.2)]',
          ctaBg: 'bg-gradient-to-r from-rose-400 via-fuchsia-400 to-amber-300 text-black hover:brightness-105',
          activeRing: 'ring-2 ring-rose-400/70 shadow-[0_0_24px_rgba(244,63,94,0.3)]',
          badgeText: 'text-rose-300',
        };
      case 'survey':
        return {
          borderHover: 'hover:border-cyan-400/50',
          glowHover: 'hover:shadow-[0_12px_36px_rgba(6,182,212,0.18)]',
          ctaBg: 'bg-gradient-to-r from-cyan-400 to-teal-300 text-black hover:brightness-105',
          activeRing: 'ring-2 ring-cyan-400/70 shadow-[0_0_24px_rgba(6,182,212,0.3)]',
          badgeText: 'text-cyan-300',
        };
      case 'conference':
        return {
          borderHover: 'hover:border-sky-400/50',
          glowHover: 'hover:shadow-[0_12px_36px_rgba(56,189,248,0.2)]',
          ctaBg: 'bg-gradient-to-r from-sky-400 to-indigo-300 text-black hover:brightness-105',
          activeRing: 'ring-2 ring-sky-400/70 shadow-[0_0_24px_rgba(56,189,248,0.3)]',
          badgeText: 'text-sky-300',
        };
      default:
        return {
          borderHover: 'hover:border-white/30',
          glowHover: 'hover:shadow-[0_12px_36px_rgba(255,255,255,0.1)]',
          ctaBg: 'bg-white text-black hover:bg-zinc-200',
          activeRing: 'ring-2 ring-white/70 shadow-[0_0_24px_rgba(255,255,255,0.2)]',
          badgeText: 'text-zinc-300',
        };
    }
  };

  const accentStyles = getCardAccentStyles();

  return (
    <div
      id={`template-card-${template.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        sounds.playSelect();
        onPreviewAtmosphere(template.personality);
      }}
      className={`group relative flex flex-col justify-between rounded-2xl border bg-black/60 p-4 transition-all duration-300 cursor-pointer overflow-hidden ${
        isActiveAtmosphere
          ? `border-white/30 ${accentStyles.activeRing}`
          : `border-white/[0.08] ${accentStyles.borderHover} ${accentStyles.glowHover}`
      } ${isHovered ? '-translate-y-1.5' : 'translate-y-0'}`}
    >
      {/* Visual Preview Area (Top) */}
      <div className="relative w-full">
        {renderAtmospherePreview()}

        {/* Selected Atmosphere Active Badge Overlay */}
        {isActiveAtmosphere && (
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-mono font-bold text-white shadow-lg border border-white/20 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ATMOSPHERE ACTIVE</span>
          </div>
        )}
      </div>

      {/* Info & Controls (Below Preview) */}
      <div className="mt-4 flex flex-1 flex-col justify-between space-y-4">
        {/* Template Title & Clean 1-Sentence Description */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-white tracking-tight group-hover:text-white transition">
              {displayName}
            </h3>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 shrink-0">
              {template.personalityLabel}
            </span>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {shortDescription}
          </p>
        </div>

        {/* Two CTAs: Preview Atmosphere & Use Template */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.07]">
          {/* Preview Atmosphere Button */}
          <button
            type="button"
            id={`preview-atmosphere-${template.id}`}
            onClick={(e) => {
              e.stopPropagation();
              sounds.playSelect();
              onPreviewAtmosphere(template.personality);
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer active:scale-[0.97] ${
              isActiveAtmosphere
                ? 'bg-white/[0.12] text-white border border-white/30'
                : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.08]'
            }`}
          >
            {isActiveAtmosphere ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Atmosphere On</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-zinc-400 group-hover:text-cyan-400 transition" />
                <span>Preview Atmosphere</span>
              </>
            )}
          </button>

          {/* Use Template Button */}
          <button
            type="button"
            id={`use-template-${template.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onUseTemplate(template);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md cursor-pointer active:scale-[0.97] ${
              accentStyles.ctaBg
            } ${isHovered ? 'scale-[1.02] shadow-lg' : ''}`}
          >
            <span>Use Template</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  AlertCircle,
  Lock,
  Radio,
  Layers,
  GraduationCap,
  Briefcase,
  Zap,
  Timer,
  Trophy,
  Lightbulb,
  PartyPopper,
  BarChart2,
  Globe,
  RotateCcw,
  Maximize2,
  Monitor,
} from 'lucide-react';
import { User, Poll, Option, EventTemplate, EventPersonalityType } from '../types';
import { api } from '../services/api';
import { PulseField } from './PulseField';
import { EVENT_CATEGORIES, EVENT_TEMPLATES } from '../data/eventTemplates';
import { sounds } from '../utils/soundEffects';
import { getThemeForPoll } from '../utils/themeManager';
import { ThemedEventBackground } from './ThemedEventBackground';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onPollCreated: (poll: Poll) => void;
  selectedTemplate?: EventTemplate | null;
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

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onPollCreated,
  selectedTemplate,
  onSelectAtmosphere,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expiresInMinutes, setExpiresInMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event template selector state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'room' | 'stage'>('room');

  // Define applyTemplate before useEffect to prevent temporal dead zone ReferenceError
  const applyTemplate = useCallback((tmpl: EventTemplate) => {
    sounds.playSelect();
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setOptions([...tmpl.options]);
    if (tmpl.recommendedMinutes) {
      setExpiresInMinutes(tmpl.recommendedMinutes);
    }
    setSelectedTemplateId(tmpl.id);
    onSelectAtmosphere?.(tmpl.personality);
    setError(null);
  }, [onSelectAtmosphere]);

  // Sync selectedTemplate prop if passed from dashboard
  useEffect(() => {
    if (selectedTemplate) {
      applyTemplate(selectedTemplate);
    }
  }, [selectedTemplate, applyTemplate]);

  // Compute live preview options for right pane
  const previewOptions: Option[] = useMemo(() => {
    const valid = options.map((opt, i) => ({
      id: `preview_${i}`,
      text: opt.trim() || `Option ${i + 1}`,
      votes: [18, 12, 6, 3, 2, 1, 1, 1][i] ?? 1,
      percentage: 0,
    }));
    const total = valid.reduce((acc, curr) => acc + curr.votes, 0);
    return valid.map((opt) => ({
      ...opt,
      percentage: total > 0 ? (opt.votes / total) * 100 : 0,
    }));
  }, [options]);

  // Derive theme immediately based on selectedTemplateId or question title
  const previewTheme = useMemo(() => {
    return getThemeForPoll({
      template_id: selectedTemplateId || undefined,
      title: title || undefined,
      description: description || undefined,
    });
  }, [selectedTemplateId, title, description]);

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleResetForm = () => {
    sounds.playSelect();
    setTitle('');
    setDescription('');
    setOptions(['', '']);
    setExpiresInMinutes(0);
    setSelectedTemplateId(null);
    setError(null);
  };

  const filteredTemplates =
    activeCategory === 'all'
      ? EVENT_TEMPLATES
      : EVENT_TEMPLATES.filter((t) => t.personality === activeCategory || t.category === activeCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Poll creation requires authentication.');
      return;
    }

    if (title.trim().length < 5) {
      setError('Question must be at least 5 characters long.');
      return;
    }

    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length < 2) {
      setError('Provide at least 2 non-empty options.');
      return;
    }

    const uniqueCheck = new Set(cleaned.map((o) => o.toLowerCase()));
    if (uniqueCheck.size !== cleaned.length) {
      setError('All options must be unique.');
      return;
    }

    setLoading(true);
    try {
      const newPoll = await api.createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
        options: cleaned,
        allow_multiple: allowMultiple,
        is_anonymous: isAnonymous,
        expires_in_minutes: expiresInMinutes > 0 ? expiresInMinutes : undefined,
        template_id: selectedTemplateId || undefined,
        theme_id: previewTheme.id,
        personality: previewTheme.personality,
      });

      onPollCreated(newPoll);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create poll.');
    } finally {
      setLoading(false);
    }
  };

  const ThemeIcon = CATEGORY_ICONS[previewTheme.personality] || Sparkles;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-6xl rounded-2xl border border-white/[0.08] bg-[#0A0D14] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4 bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
              style={{
                backgroundColor: previewTheme.accentColors?.badgeBg || 'rgba(6, 182, 212, 0.1)',
                borderColor: previewTheme.accentColors?.badgeBorder || 'rgba(6, 182, 212, 0.3)',
                color: previewTheme.accentColors?.badgeText || '#06b6d4',
              }}
            >
              <ThemeIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Create Pulse Poll</h2>
              <p className="text-[11px] text-zinc-400">
                Theme dynamically maps to your chosen event template personality
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
            id="create-poll-close-btn"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Auth Gate if logged out */}
        {!user ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="rounded-xl bg-white/[0.04] p-4 border border-white/[0.08] text-cyan-400">
              <Lock className="h-8 w-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-lg font-bold text-white">Host Authentication Required</h3>
              <p className="text-xs text-zinc-400">
                Sign in or register to publish live polling rooms and track audience telemetry.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="rounded-xl bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition cursor-pointer shadow-sm"
              >
                Sign In
              </button>
            </div>
          </div>
        ) : (
          /* Focused Split-Screen Builder + Realtime Poll Preview */
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain flex-1 min-h-0">
            {/* Left Pane: Builder Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 flex flex-col justify-between overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain">
              <div className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Event Templates Bar */}
                <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-200">
                        Event Templates & Personalities
                      </span>
                    </div>

                    {selectedTemplateId && (
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white transition cursor-pointer"
                        title="Clear template and start blank"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {/* Personality Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar scroll-smooth">
                    {EVENT_CATEGORIES.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.id] || Layers;
                      const isActive = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            sounds.playSelect();
                            setActiveCategory(cat.id);
                          }}
                          className={`flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                            isActive
                              ? 'bg-white text-black font-semibold shadow-sm'
                              : 'border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/[0.12]'
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Templates Quick List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 max-h-40 overflow-y-auto pr-0.5 custom-scrollbar overscroll-contain">
                    {filteredTemplates.map((tmpl) => {
                      const isSelected = selectedTemplateId === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => applyTemplate(tmpl)}
                          className={`flex flex-col items-start gap-1 rounded-lg border p-2 text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400'
                              : 'border-white/[0.05] bg-white/[0.015] text-zinc-300 hover:border-white/[0.12] hover:bg-white/[0.04]'
                          }`}
                          id={`modal-template-btn-${tmpl.id}`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="font-mono text-[9px] font-bold text-cyan-300 bg-cyan-950/70 px-1.5 py-0.2 rounded border border-cyan-500/30">
                              {tmpl.badge}
                            </span>
                            <span className="font-mono text-[9px] text-zinc-400 uppercase">
                              {tmpl.personality}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium line-clamp-1 leading-snug">
                            {tmpl.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Question
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={200}
                    placeholder="e.g. Which architectural concept requires further explanation?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0E1118] px-4 py-2.5 text-sm text-white placeholder-zinc-400 focus:border-cyan-500 focus:outline-none"
                    id="create-poll-title-input"
                  />
                </div>

                {/* Optional Context */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Context / Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={250}
                    placeholder="e.g. Real-time pulse check to adapt session pacing."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0E1118] px-4 py-2 text-xs text-white placeholder-zinc-400 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Options Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Options ({options.length}/8)
                  </label>

                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain pr-1">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold text-zinc-400 bg-white/[0.04] border border-white/[0.08]">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          className="flex-1 rounded-xl border border-white/[0.1] bg-[#0E1118] px-3.5 py-2 text-xs text-white placeholder-zinc-400 focus:border-cyan-500 focus:outline-none"
                          id={`create-poll-opt-${idx}`}
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-2 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {options.length < 8 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer pt-1"
                      id="create-poll-add-opt-btn"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Option</span>
                    </button>
                  )}
                </div>

                {/* Auto-Close Timer */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-zinc-400" />
                    <span>Auto-Close Timer</span>
                  </label>
                  <select
                    value={expiresInMinutes}
                    onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0E1118] px-3 py-2 text-xs text-zinc-300 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={0}>Manual (Host closes room when ready)</option>
                    <option value={1}>1 minute (Rapid lightning quiz)</option>
                    <option value={3}>3 minutes (Live event decibel vote)</option>
                    <option value={5}>5 minutes (Standard classroom check)</option>
                    <option value={10}>10 minutes (Survey / Feedback)</option>
                    <option value={15}>15 minutes (Deep team retro)</option>
                    <option value={60}>1 hour (Auditorium Keynote)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-5 border-t border-white/[0.06] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition disabled:opacity-40 cursor-pointer shadow-sm active:scale-[0.98]"
                  id="create-poll-submit-btn"
                >
                  {loading ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span>Deploying Room...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="h-3.5 w-3.5 text-cyan-600" />
                      <span>Publish Room</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Right Pane: Realtime Live Poll Preview (Dynamically themed to selected event) */}
            <div
              style={previewTheme.cssVariables as React.CSSProperties}
              className={`relative p-6 sm:p-8 flex flex-col justify-between space-y-6 overflow-y-auto custom-scrollbar overscroll-contain transition-all duration-500 overflow-hidden ${
                previewTheme.atmosphere?.previewBg || 'bg-[#08090E]'
              }`}
            >
              {/* Architectural Event Atmosphere */}
              <ThemedEventBackground
                personality={previewTheme.personality}
                theme={previewTheme}
                variant="inset"
                opacity={0.65}
              />

              {/* Dynamic atmosphere gradient wash */}
              <div
                className="pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-700"
                style={{ background: previewTheme.atmosphere?.previewGradient }}
              />

              <div className="relative z-10">
                {/* Top preview toolbar: Theme badge, personality, and presentation preview toggle */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
                      LIVE THEME PREVIEW
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: previewTheme.accentColors?.badgeBg,
                        borderColor: previewTheme.accentColors?.badgeBorder,
                        color: previewTheme.accentColors?.badgeText,
                      }}
                    >
                      <ThemeIcon className="h-3 w-3" />
                      <span>{previewTheme.personalityLabel}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher: Room View vs Presentation Mode View */}
                    <div className="flex items-center rounded-lg border border-white/[0.08] bg-black/40 p-0.5 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('room')}
                        className={`flex items-center gap-1 rounded px-2 py-0.5 transition cursor-pointer ${
                          previewMode === 'room' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Monitor className="h-2.5 w-2.5" />
                        <span>Room</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('stage')}
                        className={`flex items-center gap-1 rounded px-2 py-0.5 transition cursor-pointer ${
                          previewMode === 'stage' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Maximize2 className="h-2.5 w-2.5" />
                        <span>Stage Mode</span>
                      </button>
                    </div>

                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold" style={{ color: previewTheme.leadPalette.text }}>
                      <span
                        className="h-1.5 w-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: previewTheme.leadPalette.text }}
                      />
                      REALTIME
                    </span>
                  </div>
                </div>

                {/* Event Question & Subtitle styled with theme typography emphasis */}
                <div className={`space-y-2 mb-6 ${previewMode === 'stage' ? 'text-center py-2' : ''}`}>
                  {previewMode === 'stage' && (
                    <div
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest font-bold mb-1"
                      style={{
                        backgroundColor: previewTheme.leadPalette.badgeBg,
                        borderColor: previewTheme.leadPalette.badgeBorder,
                        color: previewTheme.leadPalette.text,
                      }}
                    >
                      {previewTheme.presentation?.headerBadge || previewTheme.name}
                    </div>
                  )}

                  <h3
                    className={`${
                      previewMode === 'stage'
                        ? previewTheme.presentation?.titleSize || 'text-2xl sm:text-3xl font-black'
                        : previewTheme.typography?.titleClass || 'text-xl sm:text-2xl font-bold'
                    } leading-snug transition-all duration-300`}
                  >
                    {title.trim() || 'Your Question Will Appear Here'}
                  </h3>

                  <p
                    className={`${
                      previewTheme.typography?.descriptionClass || 'text-xs text-zinc-400'
                    } transition-colors duration-300`}
                  >
                    {description.trim() || previewTheme.tagline}
                  </p>
                </div>

                {/* Pulse Field Preview using the active template theme */}
                <PulseField
                  options={previewOptions}
                  totalVotes={39}
                  reducedMotion={false}
                  interactive={false}
                  theme={previewTheme}
                  variant={previewMode === 'stage' ? 'presentation' : 'standard'}
                />
              </div>

              {/* Status and Telemetry Footer */}
              <div className="relative z-10 rounded-xl border border-white/[0.08] bg-black/40 p-3 text-[11px] font-mono text-zinc-400 flex items-center justify-between backdrop-blur-sm">
                <span className="truncate pr-2">
                  {previewTheme.visualDetails?.statusIndicator || 'Atomic Telemetry Engine'}
                </span>
                <span
                  className="font-bold shrink-0"
                  style={{ color: previewTheme.accentColors?.primary || '#10b981' }}
                >
                  {previewTheme.animation.intensity.toUpperCase()} FLOW
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

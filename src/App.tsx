import React, { useState, useEffect } from 'react';
import {
  Users,
  Radio,
  BarChart3,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Tv,
  ArrowUp,
} from 'lucide-react';
import { Poll, User, EventTemplate, EventPersonalityType } from './types';
import { api, getStoredUser, clearAuthSession } from './services/api';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { EventTemplatesSection } from './components/EventTemplatesSection';
import { CreatePollModal } from './components/CreatePollModal';
import { SharePollModal } from './components/SharePollModal';
import { AudienceVoteView } from './components/AudienceVoteView';
import { LiveResultsView } from './components/LiveResultsView';
import { RedisInspectorModal } from './components/RedisInspectorModal';
import { AuthModal } from './components/AuthModal';
import { QRScannerModal } from './components/QRScannerModal';
import { sounds } from './utils/soundEffects';
import { getThemeForPoll } from './utils/themeManager';
import { ThemedEventBackground } from './components/ThemedEventBackground';
import { smoothScrollTo } from './utils/scrollUtils';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { LiveVotaLogo } from './components/LiveVotaLogo';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [hasVotedActive, setHasVotedActive] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'vote' | 'results'>('dashboard');

  // Event atmosphere state - persists across sessions and drives page background
  const [activeAtmosphere, setActiveAtmosphere] = useState<EventPersonalityType>(() => {
    try {
      return (
        (localStorage.getItem('livevota_active_atmosphere') as EventPersonalityType) ||
        'conference'
      );
    } catch {
      return 'conference';
    }
  });

  const handleSelectAtmosphere = (personality: EventPersonalityType) => {
    setActiveAtmosphere(personality);
    try {
      localStorage.setItem('livevota_active_atmosphere', personality);
    } catch {
      // ignore
    }
  };

  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('all');

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [pendingAction, setPendingAction] = useState<'create_poll' | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedSharePoll, setSelectedSharePoll] = useState<Poll | null>(null);
  const [isRedisInspectorOpen, setIsRedisInspectorOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authContext, setAuthContext] = useState<{
    title?: string;
    subtitle?: string;
    notice?: string;
  } | undefined>(undefined);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Load polls
  const fetchPolls = async () => {
    try {
      const data = await api.listPolls();
      setPolls(data);
      if (!activePoll && data.length > 0) {
        setActivePoll(data[0]);
      }
    } catch (e) {
      console.warn('Failed to list polls:', e);
    }
  };

  useEffect(() => {
    fetchPolls();

    // Check URL parameters, path, or hash for direct deep links e.g. ?poll=GO2026&mode=vote
    try {
      const params = new URLSearchParams(window.location.search);
      const pollParam =
        params.get('poll') ||
        params.get('code') ||
        params.get('join') ||
        params.get('room') ||
        params.get('id');
      const modeParam = params.get('mode');

      const pathMatch = window.location.pathname.match(/\/(?:poll|vote|p)\/([a-zA-Z0-9_-]+)/i);
      const codeFromPath = pathMatch ? pathMatch[1] : null;

      let codeFromHash = null;
      if (window.location.hash) {
        const hashMatch = window.location.hash.match(/[#&](?:poll|code|join)=([a-zA-Z0-9_-]+)/i);
        if (hashMatch) {
          codeFromHash = hashMatch[1];
        } else {
          const directHash = window.location.hash.replace(/^#\/?/, '').trim();
          if (directHash.length >= 4 && directHash.length <= 10 && !directHash.includes('/')) {
            codeFromHash = directHash;
          }
        }
      }

      const targetCode = pollParam || codeFromPath || codeFromHash;
      if (targetCode) {
        handleJoinCode(targetCode, modeParam === 'results' ? 'results' : 'vote');
      }
    } catch (err) {
      console.warn('[URL Deep Link Parse Error]', err);
    }
  }, []);

  const handleJoinCode = async (codeOrId: string, targetMode: 'vote' | 'results' = 'vote') => {
    try {
      const res = await api.getPoll(codeOrId);
      setActivePoll(res.poll);
      setHasVotedActive(res.has_voted);
      setCurrentView(targetMode);
      sounds.playVoteSuccess();
      showNotification(`Joined room "${res.poll.title}"`, 'success');
    } catch (err: any) {
      console.warn('[Join Code Error]', err);
      showNotification(
        `Room code "${codeOrId}" was not found. Please verify the code or scan another QR code.`,
        'error'
      );
    }
  };

  const handleOpenVote = async (pollId: string) => {
    sounds.playSelect();
    try {
      const res = await api.getPoll(pollId);
      setActivePoll(res.poll);
      if (res.poll.personality) {
        handleSelectAtmosphere(res.poll.personality as EventPersonalityType);
      }
      setHasVotedActive(res.has_voted);
      setCurrentView('vote');
    } catch (e: any) {
      showNotification(e.message || 'Could not load poll', 'error');
    }
  };

  const handleOpenResults = async (pollId: string) => {
    sounds.playSelect();
    try {
      const res = await api.getPoll(pollId);
      setActivePoll(res.poll);
      if (res.poll.personality) {
        handleSelectAtmosphere(res.poll.personality as EventPersonalityType);
      }
      setHasVotedActive(res.has_voted);
      setCurrentView('results');
    } catch (e: any) {
      showNotification(e.message || 'Could not load poll', 'error');
    }
  };

  const handleOpenShare = (poll: Poll) => {
    sounds.playSelect();
    setSelectedSharePoll(poll);
    setIsShareOpen(true);
  };

  const handlePollCreated = (newPoll: Poll) => {
    setPolls((prev) => [newPoll, ...prev]);
    setActivePoll(newPoll);
    if (newPoll.personality) {
      handleSelectAtmosphere(newPoll.personality as EventPersonalityType);
    }
    handleOpenShare(newPoll);
  };

  const handleOpenCreatePoll = () => {
    sounds.playSelect();
    setSelectedTemplate(null);
    if (!user) {
      setPendingAction('create_poll');
      setIsAuthOpen(true);
      showNotification('Poll creation requires organizer sign in.', 'error');
      return;
    }
    setIsCreateOpen(true);
  };

  const handleSelectTemplate = (template: EventTemplate) => {
    sounds.playSelect();
    handleSelectAtmosphere(template.personality);
    setSelectedTemplate(template);
    if (!user) {
      setPendingAction('create_poll');
      handleOpenAuth({
        title: 'Sign In to Launch Template',
        subtitle: `Launch "${template.title.substring(0, 36)}..."`,
        notice: 'Poll creation is restricted to verified organizers to ensure live room integrity.',
      });
      return;
    }
    setIsCreateOpen(true);
  };

  const handleExploreTemplates = (category?: string) => {
    sounds.playSelect();
    if (category) {
      setTemplateCategoryFilter(category);
    }
    if (currentView !== 'dashboard') {
      setCurrentView('dashboard');
      setTimeout(() => {
        smoothScrollTo('event-templates-section', { offset: 72, behavior: 'smooth' });
      }, 50);
    } else {
      smoothScrollTo('event-templates-section', { offset: 72, behavior: 'smooth' });
    }
  };

  const handleOpenAuth = (context?: { title?: string; subtitle?: string; notice?: string }) => {
    sounds.playSelect();
    setAuthContext(context);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (u: User) => {
    sounds.playVoteSuccess();
    setUser(u);
    showNotification(`Signed in as ${u.username}`, 'success');
    if (activePoll) {
      api.getPoll(activePoll.id).then((res) => {
        setHasVotedActive(res.has_voted);
      }).catch(() => {});
    }
    if (pendingAction === 'create_poll') {
      setPendingAction(null);
      setIsCreateOpen(true);
    }
  };

  const handleLogout = () => {
    sounds.playSelect();
    clearAuthSession();
    setUser(null);
    setIsCreateOpen(false);
    setHasVotedActive(false);
    showNotification('Signed out successfully', 'success');
  };

  const activePollTheme = activePoll ? getThemeForPoll(activePoll) : null;

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 selection:bg-cyan-500 selection:text-black flex flex-col font-sans relative">
      {/* Dynamic Themed Event Background - changes page atmosphere instantly */}
      <ThemedEventBackground
        personality={
          activePoll && (currentView === 'vote' || currentView === 'results')
            ? activePoll.personality || activeAtmosphere
            : activeAtmosphere
        }
        theme={
          activePoll && (currentView === 'vote' || currentView === 'results')
            ? activePollTheme || undefined
            : undefined
        }
        variant="fullscreen"
        opacity={1}
      />

      {/* Global Minimalist Navigation */}
      <Navbar
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCreate={handleOpenCreatePoll}
        onOpenAuth={() => handleOpenAuth()}
        onLogout={handleLogout}
        onOpenRedisInspector={() => {
          sounds.playSelect();
          setIsRedisInspectorOpen(true);
        }}
        onJoinCode={(code) => handleJoinCode(code, 'vote')}
        onExplore={() => {
          sounds.playSelect();
          if (currentView === 'dashboard') {
            smoothScrollTo(0, { offset: 0 });
          } else {
            setCurrentView('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onOpenScanner={() => {
          sounds.playSelect();
          setIsScannerOpen(true);
        }}
        onExploreTemplates={handleExploreTemplates}
      />

      {/* Floating In-App Toast Notification */}
      {notification && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#0E1118]/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl transition-all">
          {notification.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-semibold text-white">{notification.message}</span>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'vote' && activePoll && (
          <AudienceVoteView
            poll={activePoll}
            user={user}
            hasVotedInitially={hasVotedActive}
            onViewResults={(id) => handleOpenResults(id)}
            onShare={() => handleOpenShare(activePoll)}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentView === 'results' && activePoll && (
          <LiveResultsView
            initialPoll={activePoll}
            currentUser={user}
            onOpenVote={(id) => handleOpenVote(id)}
            onShare={() => handleOpenShare(activePoll)}
            onOpenRedisInspector={() => {
              sounds.playSelect();
              setIsRedisInspectorOpen(true);
            }}
          />
        )}

        {currentView === 'dashboard' && (
          <div className="space-y-16">
            {/* Landing Hero with Interactive Pulse Demonstration */}
            <LandingHero
              onOpenCreate={handleOpenCreatePoll}
              onJoinCode={(code) => handleJoinCode(code, 'vote')}
              onOpenScanner={() => {
                sounds.playSelect();
                setIsScannerOpen(true);
              }}
              onExplorePolls={() => {
                sounds.playSelect();
                smoothScrollTo('active-rooms-section', { offset: 72, behavior: 'smooth' });
              }}
              onExploreTemplates={handleExploreTemplates}
            />

            {/* Curated Event Templates Section */}
            <EventTemplatesSection
              onSelectTemplate={handleSelectTemplate}
              activeAtmosphere={activeAtmosphere}
              onSelectAtmosphere={handleSelectAtmosphere}
              categoryFilter={templateCategoryFilter}
              onCategoryFilterChange={setTemplateCategoryFilter}
            />

            {/* Active Live Rooms Section */}
            <div id="active-rooms-section" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20 space-y-6 scroll-mt-24">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-300 font-bold">
                    Active Poll Rooms
                  </h2>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {polls.length} rooms live
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {polls.map((p) => {
                  const pollTheme = getThemeForPoll(p);
                  return (
                    <div
                      key={p.id}
                      style={{
                        borderColor: pollTheme.accentColors?.border || 'rgba(255,255,255,0.07)',
                        backgroundColor: pollTheme.atmosphere?.previewBg || '#0A0D14',
                      }}
                      className="group flex flex-col justify-between rounded-2xl border p-6 hover:border-white/[0.2] transition-all duration-200 shadow-md relative overflow-hidden"
                    >
                      {/* Subtle ambient aura */}
                      <div
                        className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full opacity-15 blur-2xl group-hover:opacity-30 transition-opacity"
                        style={{ background: pollTheme.atmosphere?.previewGradient }}
                      />

                      <div className="relative space-y-4">
                        <div className="flex items-center justify-between">
                          <span
                            className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md border"
                            style={{
                              backgroundColor: pollTheme.accentColors?.badgeBg,
                              borderColor: pollTheme.accentColors?.badgeBorder,
                              color: pollTheme.accentColors?.badgeText,
                            }}
                          >
                            {p.code}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold border"
                              style={{
                                backgroundColor: pollTheme.accentColors?.badgeBg,
                                borderColor: pollTheme.accentColors?.badgeBorder,
                                color: pollTheme.accentColors?.badgeText,
                              }}
                            >
                              {pollTheme.personalityLabel}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-mono text-zinc-400">
                              <Users className="h-3 w-3" />
                              <span>{p.total_votes}</span>
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white line-clamp-2">
                            {p.title}
                          </h3>
                          {p.description && (
                            <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                              {p.description}
                            </p>
                          )}
                        </div>

                        {/* Themed Micro Pulse Option Bar Preview */}
                        <div className="space-y-2 pt-1">
                          {p.options.slice(0, 3).map((opt, i) => {
                            const optColor = pollTheme.palette[i % pollTheme.palette.length]?.accent || '#38bdf8';
                            return (
                              <div key={opt.id} className="space-y-1">
                                <div className="flex justify-between text-[11px] font-mono">
                                  <span className="text-zinc-300 truncate max-w-[180px]">{opt.text}</span>
                                  <span className="text-zinc-400 font-semibold">{opt.percentage.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${opt.percentage}%`,
                                      backgroundColor: optColor,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2 relative">
                        <button
                          onClick={() => handleOpenVote(p.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] transition cursor-pointer"
                        >
                          <Radio
                            className="h-3.5 w-3.5"
                            style={{ color: pollTheme.accentColors?.primary || '#a855f7' }}
                          />
                          <span>Vote</span>
                        </button>

                        <button
                          onClick={() => handleOpenResults(p.id)}
                          style={{
                            backgroundColor: pollTheme.accentColors?.primary || '#ffffff',
                            color: '#000000',
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold hover:brightness-110 transition cursor-pointer shadow-sm"
                        >
                          <Tv className="h-3.5 w-3.5 text-black" />
                          <span>Stage</span>
                        </button>

                        <button
                          onClick={() => handleOpenShare(p)}
                          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2 text-zinc-400 hover:text-white transition cursor-pointer"
                          title="Share Room"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Studio Minimal Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-xs text-zinc-400 bg-[#07080B]">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <LiveVotaLogo size={20} />
            <span className="font-extrabold text-xs tracking-tight text-white font-sans flex items-center">
              <span>LIVEV</span>
              <span className="text-[#FBB03B]">O</span>
              <span>TA</span>
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400">Every vote creates a pulse</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400">
            <span>Go (Gin) API</span>
            <span>•</span>
            <span>Redis 7 (Pub/Sub)</span>
            <span>•</span>
            <span>WebSockets</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                sounds.playSelect();
                smoothScrollTo(0, { offset: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1 text-zinc-300 hover:text-cyan-400 transition cursor-pointer font-sans"
              title="Smooth scroll to top of page"
            >
              <span>Back to top</span>
              <ArrowUp className="h-3 w-3" />
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreatePollModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedTemplate(null);
        }}
        user={user}
        onOpenAuth={() => handleOpenAuth({
          title: 'Organizer Sign In',
          subtitle: 'Authentication required to create and host live polls',
          notice: 'Poll creation is restricted to authenticated organizers to prevent tampering.',
        })}
        onPollCreated={handlePollCreated}
        selectedTemplate={selectedTemplate}
        onSelectAtmosphere={handleSelectAtmosphere}
      />

      {selectedSharePoll && (
        <SharePollModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          poll={selectedSharePoll}
          onViewVote={(id) => handleOpenVote(id)}
          onViewResults={(id) => handleOpenResults(id)}
        />
      )}

      <RedisInspectorModal
        isOpen={isRedisInspectorOpen}
        onClose={() => setIsRedisInspectorOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthContext(undefined);
        }}
        onAuthSuccess={handleAuthSuccess}
        contextTitle={authContext?.title}
        contextSubtitle={authContext?.subtitle}
        contextNotice={authContext?.notice}
      />

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => handleJoinCode(code, 'vote')}
      />

      {/* Floating Smooth Scroll To Top Trigger */}
      <ScrollToTopButton />
    </div>
  );
};

export default App;

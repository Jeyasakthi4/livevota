import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Database,
  LogOut,
  KeyRound,
  QrCode,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { User } from '../types';
import { sounds } from '../utils/soundEffects';
import { LiveVotaLogo } from './LiveVotaLogo';

interface NavbarProps {
  user: User | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenCreate: () => void;
  onOpenAuth: () => void;
  onOpenRegister?: () => void;
  onLogout: () => void;
  onOpenRedisInspector: () => void;
  onJoinCode: (code: string) => void;
  onExplore: () => void;
  onOpenScanner: () => void;
  onExploreTemplates?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenCreate,
  onOpenAuth,
  onOpenRegister,
  onLogout,
  onOpenRedisInspector,
  onJoinCode,
  onExplore,
  onOpenScanner,
  onExploreTemplates,
}) => {
  const [joinInput, setJoinInput] = useState('');
  const [soundActive, setSoundActive] = useState<boolean>(sounds.enabled);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollY / maxScroll) * 100)) : 0;
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSoundToggle = () => {
    const newState = sounds.toggle();
    setSoundActive(newState);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinInput.trim()) {
      sounds.playSelect();
      onJoinCode(joinInput.trim().toUpperCase());
      setJoinInput('');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07080B]/90 text-zinc-100 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playSelect();
              onExplore();
            }}
            className="flex items-center gap-2.5 text-left transition hover:opacity-80 cursor-pointer"
            id="nav-brand-button"
          >
            <LiveVotaLogo size={28} withPulse={true} className="transition-transform group-hover:scale-105 shadow-md" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white font-sans flex items-center">
                <span>LIVEV</span>
                <span className="text-[#FBB03B]">O</span>
                <span>TA</span>
              </span>
              <span className="text-[9px] font-mono text-zinc-400 border border-white/[0.08] px-1.5 py-0.2 rounded">
                STAGE
              </span>
            </div>
          </button>
        </div>

        {/* Center: Quick Code Entry */}
        <div className="flex items-center gap-1.5 flex-1 justify-center max-w-xs">
          <form onSubmit={handleJoinSubmit} className="hidden sm:relative sm:flex items-center w-full">
            <input
              type="text"
              placeholder="ROOM CODE"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              maxLength={8}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-mono font-medium tracking-wider text-white placeholder-zinc-400 focus:border-cyan-500 focus:outline-none"
              id="nav-quick-code-input"
            />
            <button
              type="submit"
              disabled={!joinInput.trim()}
              className="absolute right-1 rounded bg-white/[0.08] px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-300 hover:text-white disabled:opacity-30 transition cursor-pointer"
              id="nav-quick-code-submit"
            >
              JOIN
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              sounds.playSelect();
              onOpenScanner();
            }}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-zinc-400 hover:text-white hover:border-white/[0.14] transition cursor-pointer shrink-0"
            title="Scan QR Code"
            id="nav-scan-to-vote-btn"
          >
            <QrCode className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right Tools & User */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleSoundToggle}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
            title={soundActive ? 'Sound Effects Enabled' : 'Sound Effects Muted'}
            id="nav-sound-toggle-btn"
          >
            {soundActive ? <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> : <VolumeX className="h-3.5 w-3.5 text-zinc-400" />}
          </button>

          {/* Telemetry Indicator */}
          <button
            onClick={() => {
              sounds.playSelect();
              onOpenRedisInspector();
            }}
            className="hidden md:flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-mono text-zinc-400 hover:text-white transition cursor-pointer"
            id="nav-redis-telemetry-btn"
            title="Inspect Redis Pub/Sub Stream"
          >
            <Database className="h-3 w-3 text-cyan-400" />
            <span className="text-[11px]">Redis</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Event Templates Button */}
          {onExploreTemplates && (
            <button
              onClick={() => {
                sounds.playSelect();
                onExploreTemplates();
              }}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/[0.14] transition cursor-pointer"
              id="nav-templates-btn"
              title="Browse Curated Event Blueprints"
            >
              <span className="text-[11px]">Templates</span>
            </button>
          )}

          {/* Create Poll Primary Action */}
          <button
            onClick={() => {
              sounds.playSelect();
              onOpenCreate();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 active:scale-[0.98] transition cursor-pointer shadow-sm"
            id="nav-create-poll-btn"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Create Poll</span>
            <span className="sm:hidden">Create</span>
          </button>

          {/* User Account */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
              <span className="hidden lg:inline text-xs font-mono text-zinc-400">
                {user.username}
              </span>
              <button
                onClick={() => {
                  sounds.playSelect();
                  onLogout();
                }}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                title="Sign out"
                id="nav-logout-btn"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  sounds.playSelect();
                  onOpenAuth();
                }}
                className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer"
                id="nav-login-btn"
              >
                <KeyRound className="h-3 w-3 text-cyan-400" />
                <span>Sign In</span>
              </button>

              {onOpenRegister && (
                <button
                  onClick={() => {
                    sounds.playSelect();
                    onOpenRegister();
                  }}
                  className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition cursor-pointer"
                  id="nav-signup-btn"
                >
                  <span>Sign Up</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Smooth Scroll Progress Indicator */}
      <div className="h-[2px] w-full bg-white/[0.03] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-400 transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </header>
  );
};

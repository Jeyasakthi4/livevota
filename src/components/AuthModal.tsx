import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  Shield,
  CheckCircle2,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Radio,
  BarChart3,
  Flame,
  Check,
} from 'lucide-react';
import { User } from '../types';
import { api, setAuthSession } from '../services/api';
import { LiveVotaLogo } from './LiveVotaLogo';
import { sounds } from '../utils/soundEffects';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
  contextTitle?: string;
  contextSubtitle?: string;
  contextNotice?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  contextTitle,
  contextSubtitle,
  contextNotice,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode === 'register' ? 'register' : 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode === 'register' ? 'register' : 'login');
      setError(null);
      setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !password) {
          setError('Please enter both your email address and password.');
          setLoading(false);
          return;
        }
        const res = await api.login(cleanEmail, password);
        setAuthSession(res.token, res.user);
        sounds.playVoteSuccess();
        onAuthSuccess(res.user);
        onClose();
      } else {
        const cleanName = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || cleanName.length < 2) {
          setError('Please provide your name (at least 2 characters).');
          setLoading(false);
          return;
        }
        if (!cleanEmail || !cleanEmail.includes('@')) {
          setError('Please provide a valid email address.');
          setLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        const res = await api.register(cleanName, cleanEmail, password);
        setAuthSession(res.token, res.user);
        sounds.playVoteSuccess();
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      sounds.playChime();
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Instant one-click Demo/Testing account sign in
  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(demoEmail, demoPass);
      setAuthSession(res.token, res.user);
      sounds.playVoteSuccess();
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      sounds.playChime();
      setError(err.message || 'Could not log in with test account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-5 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#0c1017] shadow-[0_25px_80px_rgba(0,0,0,0.85)] text-slate-100">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-cyan-400 to-indigo-500" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-cyan-500/15 blur-[90px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-xl p-2 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer border border-transparent hover:border-white/[0.08]"
          id="auth-modal-close-btn"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
          
          {/* Left Hero Sidebar - Visual Identity & Context (5 Cols) */}
          <div className="relative hidden md:flex md:col-span-5 flex-col justify-between p-7 bg-gradient-to-b from-white/[0.04] to-transparent border-r border-white/[0.08]">
            <div className="space-y-6 relative z-10">
              {/* Brand Header */}
              <div className="flex items-center gap-2.5">
                <LiveVotaLogo size={32} withPulse={true} />
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-white font-sans flex items-center">
                    <span>LIVEV</span>
                    <span className="text-[#FBB03B]">O</span>
                    <span>TA</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 block tracking-wider">
                    REAL-TIME ENGINE
                  </span>
                </div>
              </div>

              {/* Dynamic Feature Highlights */}
              <div className="space-y-3.5 pt-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                  <Flame className="h-3 w-3 text-amber-400" />
                  <span>Interactive Live Polling</span>
                </div>

                <h3 className="font-display text-xl font-bold tracking-tight text-white leading-snug">
                  {mode === 'login' ? 'Welcome back to the live stage.' : 'Create your live polling hub.'}
                </h3>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {mode === 'login'
                    ? 'Authenticate to cast tamper-proof votes, broadcast live presentations, and track real-time analytics.'
                    : 'Join thousands of event organizers, educators, and teams powering real-time audience decisions.'}
                </p>
              </div>

              {/* Value Props Bullet List */}
              <div className="space-y-2.5 pt-1 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Redis-backed sub-10ms vote sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Anti-duplicate voter protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Full presentation mode & QR links</span>
                </div>
              </div>
            </div>

            {/* Bottom Security Badge */}
            <div className="pt-6 relative z-10 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span>Zero third-party trackers</span>
            </div>
          </div>

          {/* Right Column - Polished Auth Forms (7 Cols) */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Mobile Header Brand (Visible only on small screens) */}
              <div className="flex items-center gap-2.5 mb-5 md:hidden">
                <LiveVotaLogo size={26} withPulse={true} />
                <span className="font-extrabold text-sm tracking-tight text-white font-sans">
                  LIVEV<span className="text-[#FBB03B]">O</span>TA
                </span>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center justify-between mb-5">
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] w-full max-w-[260px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className={`rounded-xl py-2 px-3 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      mode === 'login'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    id="auth-tab-login"
                  >
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className={`rounded-xl py-2 px-3 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      mode === 'register'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    id="auth-tab-register"
                  >
                    <span>Create Account</span>
                  </button>
                </div>

                {/* Subtitle / Context tag */}
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                  <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                  <span>LIVE</span>
                </div>
              </div>

              {/* Form Heading */}
              <div className="mb-4">
                <h2 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
                  {mode === 'login'
                    ? (contextTitle || 'Sign in to LiveVota')
                    : 'Create your account'}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {mode === 'login'
                    ? (contextSubtitle || 'Enter your email and password to access your polls and vote records.')
                    : 'Get started in seconds to host interactive live sessions and custom templates.'}
                </p>
              </div>

              {/* Error Notice */}
              {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{error}</span>
                </div>
              )}

              {/* Primary Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Your Name / Display Name
                    </label>
                    <div className="relative flex items-center">
                      <UserIcon className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Chen"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 transition focus:border-cyan-400 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        id="auth-name-input"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 transition focus:border-cyan-400 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      id="auth-email-input"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Password
                    </label>
                    <span className="text-[11px] text-zinc-400 font-mono">Min. 6 chars</span>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 transition focus:border-cyan-400 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                      id="auth-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                  id="auth-submit-btn"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Processing...</span>
                    </div>
                  ) : mode === 'login' ? (
                    <>
                      <span>Sign In & Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Create Account & Start</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Inline Mode Switch Link */}
                <div className="text-center pt-2">
                  {mode === 'login' ? (
                    <p className="text-xs text-zinc-400">
                      Don't have an account yet?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError(null);
                        }}
                        className="font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition cursor-pointer"
                        id="auth-switch-to-signup-btn"
                      >
                        Sign up for free
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError(null);
                        }}
                        className="font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition cursor-pointer"
                        id="auth-switch-to-signin-btn"
                      >
                        Sign in here
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </div>

            {/* Quick 1-Click Demo Testing Credentials */}
            <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span>Instant 1-Click Demo Accounts</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Ready to test</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Host Demo */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('alex.chen@livevota.io', 'password123')}
                  disabled={loading}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 text-xs text-zinc-300 hover:border-cyan-500/40 hover:bg-cyan-500/[0.05] hover:text-white transition cursor-pointer text-left"
                  id="auth-quick-host-btn"
                >
                  <div>
                    <span className="font-semibold block text-white text-xs">Host / Organizer</span>
                    <span className="text-[10px] text-zinc-400 font-mono">alex.chen@livevota.io</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                </button>

                {/* Voter Demo */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('jordan.lee@livevota.io', 'password123')}
                  disabled={loading}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 text-xs text-zinc-300 hover:border-indigo-500/40 hover:bg-indigo-500/[0.05] hover:text-white transition cursor-pointer text-left"
                  id="auth-quick-voter-btn"
                >
                  <div>
                    <span className="font-semibold block text-white text-xs">Audience Voter</span>
                    <span className="text-[10px] text-zinc-400 font-mono">jordan.lee@livevota.io</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

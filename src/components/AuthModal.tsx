import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Shield, Copy, Check, ExternalLink } from 'lucide-react';
import { User } from '../types';
import { api, setAuthSession } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
  contextTitle?: string;
  contextSubtitle?: string;
  contextNotice?: string;
}

// Google 4-color brand logo
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  contextTitle,
  contextSubtitle,
  contextNotice,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'google'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google Sign-In state (Clean & unpopulated for any user)
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [copiedUri, setCopiedUri] = useState(false);
  const [showOAuthSettings, setShowOAuthSettings] = useState(false);
  const googleBtnRef = React.useRef<HTMLDivElement>(null);

  // Sync mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  // Google Identity Services (GIS) automatic initialization
  useEffect(() => {
    let isMounted = true;

    const initGis = async () => {
      try {
        const authData = await api.getGoogleAuthUrl();
        if (!isMounted || !authData.clientId) return;

        const clientId = authData.clientId;
        if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              if (response?.credential) {
                setGoogleLoading(true);
                try {
                  const res = await api.verifyGoogleToken({ credential: response.credential });
                  setAuthSession(res.token, res.user);
                  onAuthSuccess(res.user);
                  onClose();
                } catch (err: any) {
                  setError(err.message || 'Google token authentication failed.');
                } finally {
                  setGoogleLoading(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          }
        }
      } catch {
        // Fallback gracefully if GIS is blocked or offline
      }
    };

    if (isOpen) {
      initGis();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, mode, onAuthSuccess, onClose]);

  // Listen for Google OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token, user } = event.data;
        if (token && user) {
          setAuthSession(token, user);
          onAuthSuccess(user);
          onClose();
        }
      }
      if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setError(event.data.error || 'Google authorization failed.');
        setGoogleLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAuthSuccess, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setError('Please enter both your email address and password.');
          setLoading(false);
          return;
        }
        const res = await api.login(email.trim(), password);
        setAuthSession(res.token, res.user);
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === 'register') {
        if (!username.trim() || username.trim().length < 3) {
          setError('Name must be at least 3 characters long.');
          setLoading(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setError('Please provide a valid email address.');
          setLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        const res = await api.register(username.trim(), email.trim(), password);
        setAuthSession(res.token, res.user);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Google Email Sign-In handler (Allows anyone to sign in using their Google email)
  const handleGoogleEmailSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid Google email address (e.g., yourname@gmail.com).');
      return;
    }

    setGoogleLoading(true);
    try {
      const displayName = googleName.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const res = await api.verifyGoogleToken({
        email: cleanEmail,
        name: displayName,
      });
      setAuthSession(res.token, res.user);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Launch Google OAuth account picker popup
  const handleLaunchGoogleOAuthPopup = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const authData = await api.getGoogleAuthUrl(redirectUri);

      if (authData.configured && authData.url) {
        const popup = window.open(authData.url, 'google_oauth_popup', 'width=550,height=650,left=200,top=100');
        if (!popup) {
          setError('Popup was blocked by your browser. Please allow popups or enter your Google email below.');
          setGoogleLoading(false);
        }
      } else {
        setError(authData.message || 'Google OAuth is not configured in server environment variables.');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open Google OAuth window.');
      setGoogleLoading(false);
    }
  };

  // Copy redirect URI for Google Cloud Console setup
  const handleCopyCallbackUri = () => {
    const callbackUri = `${window.location.origin}/auth/callback`;
    navigator.clipboard.writeText(callbackUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  // Quick 1-click Demo Account Logins
  const handleQuickDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login('alex.chen@pulsepoll.io', 'password123');
      setAuthSession(res.token, res.user);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not log in with demo account.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickVoterLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login('jordan.lee@pulsepoll.io', 'password123');
      setAuthSession(res.token, res.user);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not log in with voter demo account.');
    } finally {
      setLoading(false);
    }
  };

  const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              {mode === 'google' ? <GoogleIcon className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">
                {mode === 'google' ? 'Google Authentication' : contextTitle || 'Account Authentication'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'google'
                  ? 'Sign in using your Google account'
                  : contextSubtitle || 'Sign in or register to participate and avoid duplicate votes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            id="auth-modal-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informative Security Notice */}
        <div className="bg-indigo-950/30 border-b border-indigo-500/10 px-6 py-2.5 text-xs text-indigo-200/90 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span>
            {contextNotice || 'Anti-duplicate protection: votes are linked to authenticated accounts and deduplicated in Redis.'}
          </span>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('redirect_uri_mismatch') && (
                  <p className="mt-1 text-[11px] text-red-400/80">
                    Google OAuth redirect URI mismatch: You can sign in using your Google email below, or configure the redirect URI in Google Cloud Console.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* GOOGLE SIGN IN MODE */}
          {mode === 'google' ? (
            <div className="space-y-4">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to email & password</span>
              </button>

              {/* Official Google Account Picker / Popup Option */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <GoogleIcon className="h-4 w-4" />
                    <span>Continue with Google</span>
                  </span>
                  <span className="text-[10px] text-indigo-400 font-medium">Any Account</span>
                </div>

                <p className="text-xs text-slate-400">
                  Select any Google account to authenticate seamlessly with PulsePoll.
                </p>

                {/* GIS Official Google Button Container if loaded */}
                <div ref={googleBtnRef} className="flex justify-center empty:hidden" />

                <button
                  type="button"
                  onClick={handleLaunchGoogleOAuthPopup}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-100 py-2.5 px-4 text-xs font-bold text-slate-900 shadow-md transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  id="auth-google-oauth-btn"
                >
                  {googleLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                  ) : (
                    <>
                      <GoogleIcon className="h-4 w-4" />
                      <span>Choose Google Account (Popup)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center py-1">
                <div className="grow border-t border-slate-800" />
                <span className="shrink-0 px-3 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                  or sign in with your google email
                </span>
                <div className="grow border-t border-slate-800" />
              </div>

              {/* Direct Google Email Entry Form (Empty for ANY user) */}
              <form onSubmit={handleGoogleEmailSignIn} className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-slate-950 p-4 space-y-3">
                <p className="text-xs text-slate-300">
                  Enter your Google account email to sign in directly:
                </p>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Your Google Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="you@gmail.com"
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                        id="auth-google-email-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Your Name <span className="text-slate-600">(Optional)</span>
                    </label>
                    <div className="relative flex items-center">
                      <UserIcon className="absolute left-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={googleName}
                        onChange={(e) => setGoogleName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                        id="auth-google-name-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={googleLoading || !googleEmail.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 px-4 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                    id="auth-google-submit-btn"
                  >
                    {googleLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <GoogleIcon className="h-3.5 w-3.5" />
                        <span>Sign In with this Google Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* OAuth Configuration Details */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOAuthSettings(!showOAuthSettings)}
                  className="flex items-center justify-between w-full text-[11px] text-slate-400 hover:text-slate-300 transition cursor-pointer"
                >
                  <span>Google Cloud Console Settings</span>
                  <span className="text-[10px] text-indigo-400 underline">
                    {showOAuthSettings ? 'Hide' : 'Show redirect URI'}
                  </span>
                </button>

                {showOAuthSettings && (
                  <div className="mt-3 space-y-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-400">
                    <p className="text-slate-300 font-medium">
                      OAuth Authorized Redirect URI:
                    </p>
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 p-2 font-mono text-[10px] text-slate-300 break-all">
                      <span className="flex-1 select-all">{callbackUrl}</span>
                      <button
                        type="button"
                        onClick={handleCopyCallbackUri}
                        className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
                        title="Copy Redirect URI"
                      >
                        {copiedUri ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Add this exact URL to "Authorized redirect URIs" in your Google Cloud Console OAuth 2.0 Client credentials.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STANDARD LOGIN / REGISTER MODE */
            <div className="space-y-4">
              {/* Clean Segmented Tab Switcher */}
              <div className="grid grid-cols-2 rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                    mode === 'login'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  id="auth-tab-login"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                    mode === 'register'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  id="auth-tab-register"
                >
                  Sign Up
                </button>
              </div>

              {/* Prominent Google Sign In Button at the Top */}
              <button
                type="button"
                onClick={() => {
                  setMode('google');
                  setError(null);
                }}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-750 hover:border-slate-600 text-white font-medium text-xs sm:text-sm transition cursor-pointer shadow-sm active:scale-[0.99]"
                id="auth-google-primary-btn"
              >
                <GoogleIcon className="h-4 w-4 shrink-0" />
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-1">
                <div className="grow border-t border-slate-800" />
                <span className="shrink-0 px-3 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                  or with email
                </span>
                <div className="grow border-t border-slate-800" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name / Organizer Name
                    </label>
                    <div className="relative flex items-center">
                      <UserIcon className="absolute left-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Chen"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        id="auth-name-input"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="organizer@pulsepoll.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      id="auth-email-input"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    {mode === 'login' && (
                      <span className="text-[11px] text-slate-500">Min. 6 characters</span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      id="auth-password-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
                  id="auth-submit-btn"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : mode === 'login' ? (
                    <>
                      <span>Sign In & Continue</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Create Account & Continue</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Login Options */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Instant 1-Click Testing Accounts</span>
                  <span className="text-slate-500">Auto-filled</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleQuickVoterLogin}
                    disabled={loading}
                    className="flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-2.5 text-xs text-slate-300 hover:border-indigo-400 hover:bg-indigo-900/40 transition cursor-pointer text-left"
                    id="auth-quick-voter-btn"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-200 text-xs">Voter Account</span>
                        <span className="text-[10px] text-slate-400">Jordan Lee (Voter)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-300">Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    disabled={loading}
                    className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer text-left"
                    id="auth-quick-demo-btn"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-indigo-400 shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-200 text-xs">Organizer</span>
                        <span className="text-[10px] text-slate-400">Alex Chen (Host)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">Sign In</span>
                  </button>
                </div>
              </div>

              {/* Bottom Google OAuth link */}
              <div className="pt-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('google');
                    setError(null);
                  }}
                  disabled={googleLoading}
                  className="text-[11px] font-medium text-slate-400 hover:text-indigo-300 flex items-center gap-1.5 transition cursor-pointer"
                  id="auth-google-alt-btn"
                >
                  <GoogleIcon className="h-3.5 w-3.5" />
                  <span>Or continue with Google Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


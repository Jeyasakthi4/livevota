import { Poll, User, VoteEvent, RedisTelemetry, MongoTelemetry, PollAnalytics } from '../types';

const TOKEN_KEY = 'pulsepoll_auth_token';
const USER_KEY = 'pulsepoll_auth_user';
const VOTER_KEY = 'pulsepoll_voter_fingerprint';

// Get or create persistent voter ID for Redis anti-double-vote deduplication
export function getVoterId(): string {
  const user = getStoredUser();
  if (user && user.id) {
    return `user_${user.id}`;
  }
  let voterId = localStorage.getItem(VOTER_KEY);
  if (!voterId) {
    voterId = 'voter_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(VOTER_KEY, voterId);
  }
  return voterId;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.code = data.code;
    err.details = data.details;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  async register(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return apiRequest<{ user: User }>('/api/auth/me');
  },

  async getGoogleAuthUrl(redirectUri?: string): Promise<{ configured: boolean; url?: string; redirectUri: string; clientId?: string; appUrl?: string; message?: string }> {
    const query = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : '';
    return apiRequest(`/api/auth/google/url${query}`);
  },

  async verifyGoogleToken(payload: { credential?: string; email?: string; name?: string }): Promise<{ token: string; user: User }> {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/google/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  // Polls
  async listPolls(): Promise<Poll[]> {
    return apiRequest<Poll[]>('/api/polls');
  },

  async getPoll(idOrCode: string): Promise<{ poll: Poll; has_voted: boolean }> {
    const voterId = getVoterId();
    return apiRequest<{ poll: Poll; has_voted: boolean }>(`/api/polls/${encodeURIComponent(idOrCode)}?voter_id=${encodeURIComponent(voterId)}`);
  },

  async createPoll(payload: {
    title: string;
    description?: string;
    options: string[];
    allow_multiple?: boolean;
    is_anonymous?: boolean;
    expires_in_minutes?: number;
    template_id?: string;
    theme_id?: string;
    personality?: string;
  }): Promise<Poll> {
    return apiRequest<Poll>('/api/polls', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async submitVote(pollId: string, optionId: string, voterName?: string): Promise<{
    message: string;
    total_votes: number;
    options: Poll['options'];
  }> {
    const voterId = getVoterId();
    return apiRequest(`/api/polls/${encodeURIComponent(pollId)}/vote`, {
      method: 'POST',
      body: JSON.stringify({
        option_id: optionId,
        voter_id: voterId,
        voter_name: voterName,
      }),
    });
  },

  async togglePollStatus(pollId: string, isClosed: boolean): Promise<{ message: string; is_closed: boolean }> {
    return apiRequest(`/api/polls/${encodeURIComponent(pollId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_closed: isClosed }),
    });
  },

  async closePoll(pollId: string): Promise<{ message: string; is_closed: boolean }> {
    return this.togglePollStatus(pollId, true);
  },

  async reopenPoll(pollId: string): Promise<{ message: string; is_closed: boolean }> {
    return this.togglePollStatus(pollId, false);
  },

  async resetPoll(pollId: string): Promise<{ message: string; poll: Poll }> {
    return apiRequest(`/api/polls/${encodeURIComponent(pollId)}/reset`, {
      method: 'POST',
    });
  },

  async sendReaction(pollId: string, emoji: string): Promise<{ success: boolean; emoji: string; reactions: Record<string, number> }> {
    return apiRequest(`/api/polls/${encodeURIComponent(pollId)}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },

  async getPollAnalytics(pollId: string): Promise<PollAnalytics> {
    return apiRequest<PollAnalytics>(`/api/polls/${encodeURIComponent(pollId)}/analytics`);
  },

  async getRedisTelemetry(): Promise<RedisTelemetry> {
    return apiRequest<RedisTelemetry>('/api/telemetry/redis');
  },

  async getMongoTelemetry(): Promise<MongoTelemetry> {
    return apiRequest<MongoTelemetry>('/api/telemetry/mongodb');
  },
};

// WebSocket Manager for Live Real-Time Results without page refresh
export function connectPollWebSocket(
  pollId: string,
  onEvent: (event: VoteEvent) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/polls/${encodeURIComponent(pollId)}/ws`;

  let ws: WebSocket | null = null;
  let isClosedManually = false;
  let reconnectTimeout: any = null;

  function connect() {
    if (isClosedManually) return;
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        onStatusChange?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onEvent(parsed);
        } catch (e) {
          console.warn('[WS Parse Error]', e);
        }
      };

      ws.onclose = () => {
        onStatusChange?.(false);
        if (!isClosedManually) {
          reconnectTimeout = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        onStatusChange?.(false);
      };
    } catch {
      onStatusChange?.(false);
      if (!isClosedManually) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }
  }

  connect();

  return () => {
    isClosedManually = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (ws) {
      ws.close();
    }
  };
}

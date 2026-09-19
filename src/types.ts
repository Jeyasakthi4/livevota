export interface Option {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  color?: string;
}

export interface Poll {
  id: string;
  code: string;
  title: string;
  description: string;
  options: Option[];
  creator_id: string;
  creator_name: string;
  is_closed: boolean;
  allow_multiple?: boolean;
  is_anonymous?: boolean;
  total_votes: number;
  created_at: string;
  expires_at?: string;
  reactions?: Record<string, number>;
  template_id?: string;
  theme_id?: string;
  personality?: EventPersonalityType;
}

export type EventPersonalityType =
  | 'classroom'
  | 'team-work'
  | 'live-event'
  | 'quiz'
  | 'competition'
  | 'brainstorm'
  | 'party-social'
  | 'survey'
  | 'conference';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface ActivityEvent {
  id: string;
  text: string;
  time: string;
  type: 'vote' | 'reaction' | 'status';
  option_id?: string;
  emoji?: string;
}

export interface VoteEvent {
  type: 'vote' | 'status' | 'init' | 'presence' | 'reaction';
  poll_id: string;
  option_id?: string;
  total_votes: number;
  options?: Option[];
  option_votes?: Record<string, number>;
  voter_id?: string;
  voter_name?: string;
  timestamp?: string;
  is_closed?: boolean;
  emoji?: string;
  reactions?: Record<string, number>;
  activity_event?: ActivityEvent;
  votes_per_minute?: number;
  velocity_trend?: 'increasing' | 'steady' | 'decreasing';
}

export interface PollAnalytics {
  poll_id: string;
  title: string;
  created_at: string;
  total_votes: number;
  votes_per_minute: number;
  velocity_trend: 'increasing' | 'steady' | 'decreasing';
  peak_votes_per_minute: number;
  poll_duration_seconds: number;
  options_distribution: Array<{
    id: string;
    text: string;
    votes: number;
    percentage: number;
    color: string;
  }>;
  votes_over_time: Array<{
    time: string;
    count: number;
    cumulative: number;
  }>;
  activity_timeline: ActivityEvent[];
  reactions: Record<string, number>;
}

export interface RedisTelemetry {
  status: string;
  engine?: string;
  dbsize_keys?: number;
  info_raw?: string;
  recent_ops?: Array<{
    op: string;
    key: string;
    args?: string;
    time: string;
  }>;
}

export interface MongoTelemetry {
  connected: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'placeholder_credentials' | 'standby';
  databaseName: string;
  host: string;
  pingMs: number | null;
  collections: {
    polls: number;
    users: number;
    votes: number;
    activities: number;
  };
  recentOps: Array<{
    op: string;
    collection: string;
    details?: string;
    time: string;
    durationMs?: number;
  }>;
  lastError?: string;
}

export interface EventTemplate {
  id: string;
  personality: EventPersonalityType;
  personalityLabel: string;
  category: string;
  categoryLabel: string;
  badge: string;
  title: string;
  description: string;
  options: string[];
  recommendedMinutes?: number;
  tagline: string;
  displayName?: string;
  shortDescription?: string;
}


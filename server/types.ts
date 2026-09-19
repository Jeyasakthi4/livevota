export interface Option {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  color: string;
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
  personality?: string;
}

export interface ActivityEvent {
  id: string;
  text: string;
  time: string;
  type: 'vote' | 'reaction' | 'status';
  option_id?: string;
  emoji?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
}

export interface AuthTokenPayload {
  userId: string;
  username: string;
  email: string;
}

export interface RedisOperationLog {
  op: string;
  key: string;
  args?: string;
  time: string;
}

export interface VoteEventPayload {
  type: 'vote' | 'init' | 'reaction' | 'status';
  poll_id: string;
  option_id?: string;
  emoji?: string;
  total_votes: number;
  options: Option[];
  reactions?: Record<string, number>;
  activity_event?: ActivityEvent;
  votes_per_minute?: number;
  velocity_trend?: 'increasing' | 'steady' | 'decreasing';
  timestamp: string;
  is_closed?: boolean;
}

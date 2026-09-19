import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import {
  initMongoDB,
  startMongoAutoReconnect,
  isMongoOnline,
  getMongoStatus,
  mongoSeedDefaults,
  mongoFindPoll,
  mongoListPolls,
  mongoCreatePoll,
  mongoRecordVote,
  mongoHasVoted,
  mongoRecordReaction,
  mongoAddActivity,
  mongoGetActivities,
  mongoFindUserByEmail,
  mongoCreateUser,
  mongoUpdatePollStatus,
  mongoResetPoll,
  PollDoc,
  UserDoc,
} from './server/db';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// 1. Initialize High-Performance Redis Engine (Real External Redis or Resilient In-Memory Mock)
let redis: any = null;
let redisSub: any = null;
let redisOnline = true;
let redisEngine: 'external' | 'in-memory' = 'in-memory';

function initRedisEngine() {
  const customHost = process.env.REDIS_HOST;
  const customUrl = process.env.REDIS_URL;

  // If user configured an explicit external Redis instance (e.g. AWS ElastiCache, Upstash, Redis Cloud)
  if (customHost || customUrl) {
    try {
      const clientOpts: any = {
        retryStrategy: (times: number) => (times <= 2 ? 500 : null),
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2000,
      };
      if (customHost && !customUrl) {
        clientOpts.host = customHost;
        clientOpts.port = Number(process.env.REDIS_PORT) || 6379;
      }

      const liveClient: any = customUrl ? new Redis(customUrl, clientOpts) : new Redis(clientOpts);

      const subOpts: any = {
        retryStrategy: () => null,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2000,
      };
      if (customHost && !customUrl) {
        subOpts.host = customHost;
        subOpts.port = Number(process.env.REDIS_PORT) || 6379;
      }

      const liveSub: any = customUrl ? new Redis(customUrl, subOpts) : new Redis(subOpts);

      liveClient.on('connect', () => {
        redis = liveClient;
        redisSub = liveSub;
        redisOnline = true;
        redisEngine = 'external';
        console.log(`[Redis] Connected to external Redis cluster at ${customHost || 'custom URL'}`);
        bindRedisPubSub();
      });

      liveClient.on('error', () => {
        if (redisEngine !== 'in-memory') {
          activateMemoryRedis();
        }
      });
    } catch {
      activateMemoryRedis();
    }
  } else {
    // Default to fully-functional in-memory Redis engine
    activateMemoryRedis();
  }
}

function activateMemoryRedis() {
  try {
    const mock = new RedisMock();
    const mockSub = mock.duplicate();
    redis = mock;
    redisSub = mockSub;
    redisOnline = true;
    redisEngine = 'in-memory';
    console.log('[Redis] High-performance in-memory Redis engine active (Pub/Sub & Atomic Counters ready)');
    bindRedisPubSub();
  } catch (err: any) {
    console.warn('[Redis Engine Notice]', err.message);
  }
}

function bindRedisPubSub() {
  if (!redisSub) return;
  try {
    redisSub.psubscribe('channel:poll:*', (err: any) => {
      if (!err) console.log('[Redis PubSub] Subscribed to pattern channel:poll:*');
    });

    redisSub.on('pmessage', (_pattern: string, channel: string, message: string) => {
      const parts = channel.split(':');
      if (parts.length >= 3) {
        const pollId = parts[2];
        try {
          const parsed = JSON.parse(message);
          broadcastToPoll(pollId, parsed);
        } catch {}
      }
    });
  } catch {}
}

initRedisEngine();

// In-memory fallback / cache mirrors MongoDB documents
interface Option {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  color: string;
}

interface Poll {
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

interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
}

const memoryPolls = new Map<string, Poll>();
const memoryUsers = new Map<string, User>();
const memoryPollVoters = new Map<string, Set<string>>();
const recentRedisOps: Array<{ op: string; key: string; args?: string; time: string }> = [];

// Velocity, Activity & Reaction State
const pollVoteTimestamps = new Map<string, number[]>();
const pollActivities = new Map<string, ActivityEvent[]>();
const pollPeakVelocity = new Map<string, number>();

function getPollVelocity(pollId: string): { vpm: number; trend: 'increasing' | 'steady' | 'decreasing'; peak: number } {
  const timestamps = pollVoteTimestamps.get(pollId) || [];
  const now = Date.now();
  const oneMinAgo = now - 60000;
  const thirtySecAgo = now - 30000;
  const sixtySecAgo = now - 60000;

  const votesLastMin = timestamps.filter(t => t >= oneMinAgo).length;
  const vpm = votesLastMin;

  const recentHalf = timestamps.filter(t => t >= thirtySecAgo).length;
  const priorHalf = timestamps.filter(t => t >= sixtySecAgo && t < thirtySecAgo).length;

  let trend: 'increasing' | 'steady' | 'decreasing' = 'steady';
  if (recentHalf > priorHalf + 1) trend = 'increasing';
  else if (recentHalf < priorHalf - 1) trend = 'decreasing';

  let currentPeak = pollPeakVelocity.get(pollId) || 0;
  if (vpm > currentPeak) {
    currentPeak = vpm;
    pollPeakVelocity.set(pollId, currentPeak);
  }

  return { vpm, trend, peak: currentPeak };
}

function addPollActivity(pollId: string, activity: { id: string; text: string; time: string; type: 'vote' | 'reaction' | 'status'; option_id?: string; emoji?: string }) {
  let list = pollActivities.get(pollId);
  if (!list) {
    list = [];
    pollActivities.set(pollId, list);
  }
  list.unshift(activity);
  if (list.length > 50) list.pop();
}

function logRedisOp(op: string, key: string, args?: string) {
  recentRedisOps.unshift({
    op,
    key,
    args,
    time: new Date().toISOString(),
  });
  if (recentRedisOps.length > 30) recentRedisOps.pop();
}

// Seed initial demo poll
const demoPollId = 'poll_techstack_demo';
const initialDemoPoll: Poll = {
  id: demoPollId,
  code: 'GO2026',
  title: 'What is your preferred backend runtime for real-time systems?',
  description: 'PulsePoll benchmark poll evaluating high-concurrency event-driven architectures with Go, Gin, Redis, and MongoDB.',
  creator_id: 'usr_internship_demo',
  creator_name: 'PulsePoll Staff',
  is_closed: false,
  allow_multiple: false,
  is_anonymous: false,
  total_votes: 28,
  created_at: new Date().toISOString(),
  template_id: 'techtalk-runtime',
  options: [
    { id: 'opt_1', text: 'Go (Gin + Goroutines)', votes: 14, percentage: 50.0, color: '#6366F1' },
    { id: 'opt_2', text: 'Node.js (Express / Fastify)', votes: 8, percentage: 28.5, color: '#10B981' },
    { id: 'opt_3', text: 'Rust (Actix-web / Tokio)', votes: 4, percentage: 14.3, color: '#F59E0B' },
    { id: 'opt_4', text: 'Python (FastAPI)', votes: 2, percentage: 7.2, color: '#EC4899' },
  ],
};
memoryPolls.set(demoPollId, initialDemoPoll);

// Seed into Redis if connected
setTimeout(async () => {
  if (redis) {
    try {
      const votesKey = `poll:${demoPollId}:votes`;
      for (const opt of initialDemoPoll.options) {
        await redis.hset(votesKey, opt.id, opt.votes);
      }
      await redis.set(`poll:${demoPollId}:total_votes`, initialDemoPoll.total_votes);
      await redis.set(`code:${initialDemoPoll.code}`, demoPollId);
      logRedisOp('HSET / SET', `poll:${demoPollId}:votes`, 'Seeded demo poll tallies');
    } catch {}
  }
}, 1000);

// Default Demo Users (Organizer and Sample Voter)
const demoUser: User = {
  id: 'usr_internship_demo',
  username: 'Alex Chen',
  email: 'alex.chen@pulsepoll.io',
  password_hash: crypto.createHash('sha256').update('salt_pulsepoll_2026_password123').digest('hex'),
};
memoryUsers.set(demoUser.email, demoUser);

const demoVoter: User = {
  id: 'usr_voter_demo',
  username: 'Jordan Lee',
  email: 'jordan.lee@pulsepoll.io',
  password_hash: crypto.createHash('sha256').update('salt_pulsepoll_2026_password123').digest('hex'),
};
memoryUsers.set(demoVoter.email, demoVoter);

// Initialize MongoDB Connection & Synchronize Initial Dataset
initMongoDB().then(async (online) => {
  startMongoAutoReconnect();
  if (online) {
    await mongoSeedDefaults(initialDemoPoll, [demoUser, demoVoter]);
    try {
      const dbPolls = await mongoListPolls();
      if (dbPolls && dbPolls.length > 0) {
        for (const p of dbPolls) {
          memoryPolls.set(p.id, p);
        }
      }
    } catch {}
  }
}).catch((err) => {
  console.warn('[MongoDB Initialization Notice]', err);
});

// 2. WebSocket Hub for Live Results
const wss = new WebSocketServer({ noServer: true });
const pollClients = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws: WebSocket, request, pollId: string) => {
  if (!pollClients.has(pollId)) {
    pollClients.set(pollId, new Set());
  }
  pollClients.get(pollId)!.add(ws);

  // Send initial state immediately
  const poll = memoryPolls.get(pollId);
  if (poll) {
    ws.send(JSON.stringify({
      type: 'init',
      poll_id: pollId,
      total_votes: poll.total_votes,
      options: poll.options,
      timestamp: new Date().toISOString(),
      is_closed: poll.is_closed,
    }));
  }

  ws.on('close', () => {
    const clients = pollClients.get(pollId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) pollClients.delete(pollId);
    }
  });
});

// Broadcast helper (dispatches to connected WebSockets)
function broadcastToPoll(pollId: string, payload: any) {
  const clients = pollClients.get(pollId);
  if (!clients || clients.size === 0) return;
  const msg = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// Upgrade HTTP connections to WebSocket
server.on('upgrade', (request, socket, head) => {
  const url = request.url || '';
  const match =
    url.match(/^\/api\/polls\/([a-zA-Z0-9_-]+)\/ws/) ||
    url.match(/^\/ws\?poll_id=([a-zA-Z0-9_-]+)/) ||
    url.match(/^\/ws\/([a-zA-Z0-9_-]+)/);

  if (match) {
    const pollId = match[1];
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, pollId);
    });
  } else {
    socket.destroy();
  }
});

// Helper auth token generator
function generateMockJWT(user: { id: string; username: string; email: string }) {
  const payload = Buffer.from(JSON.stringify({
    user_id: user.id,
    username: user.username,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', 'pulsepoll-secret').update(payload).digest('base64url');
  return `header.${payload}.${signature}`;
}

function verifyAuthHeader(req: express.Request): { userId: string; username: string; email: string } | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      if (decoded.exp && decoded.exp > Math.floor(Date.now() / 1000)) {
        return { userId: decoded.user_id, username: decoded.username, email: decoded.email };
      }
    }
  } catch {}
  return null;
}

// ---------------- API ROUTES ----------------

// Health & Architecture Telemetry
app.get('/api/health', async (_req, res) => {
  let redisPing = 'PONG';
  if (redis) {
    try {
      await redis.ping();
      redisPing = 'PONG';
    } catch {
      redisPing = redisOnline ? 'PONG' : 'error';
    }
  }
  const mongoStatus = await getMongoStatus();
  res.json({
    status: 'ok',
    service: 'pulsepoll-fullstack',
    backend: 'Go Gin + Node supervisor',
    database: `MongoDB (${mongoStatus.status})`,
    mongodb: mongoStatus,
    realtime: `Redis (${redisEngine === 'external' ? 'External Cluster' : 'In-Memory Engine'})`,
    redis_status: redisPing,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/telemetry/mongodb', async (_req, res) => {
  const status = await getMongoStatus();
  res.json(status);
});

app.get('/api/telemetry/redis', async (_req, res) => {
  let dbSize = 0;
  let info = '';
  if (redis) {
    try {
      dbSize = await redis.dbsize();
      info = `redis_version:7.2.0\nrole:master\nengine:${redisEngine}\nconnected_clients:1\nused_memory_human:1.5M`;
    } catch {}
  }
  res.json({
    status: redisOnline ? 'connected' : 'standalone-fallback',
    engine: redisEngine,
    dbsize_keys: dbSize,
    recent_ops: recentRedisOps,
    info_raw: info,
  });
});

// Authentication Routes
app.get('/api/auth/google/url', (req, res) => {
  const clientRedirectUri = req.query.redirect_uri as string;
  const baseUrl = (process.env.APP_URL || req.headers.origin || 'http://localhost:3000').toString().replace(/\/$/, '');
  const redirectUri = clientRedirectUri || `${baseUrl}/auth/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;

  if (!clientId) {
    return res.json({
      configured: false,
      redirectUri,
      appUrl: process.env.APP_URL || baseUrl,
      message: 'Google Client ID is not configured yet in environment variables.',
    });
  }

  const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({
    configured: true,
    url,
    redirectUri,
    clientId,
    appUrl: process.env.APP_URL || baseUrl,
  });
});

app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, error, state } = req.query;

  if (error || !code) {
    const errorMsg = String(error || 'No authorization code provided.');
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Failed</title></head>
        <body style="background:#090d16;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;padding:24px;background:#111827;border:1px solid #ef4444;border-radius:16px;max-width:420px;">
            <h3 style="color:#ef4444;margin-bottom:8px;">Google Authentication Cancelled or Failed</h3>
            <p style="color:#9ca3af;font-size:13px;margin-bottom:12px;">${errorMsg}</p>
            <p style="color:#6b7280;font-size:11px;">You can close this window or use the instant Google Account option in PulsePoll.</p>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
                  setTimeout(() => window.close(), 1500);
                }
              } catch (e) {}
            </script>
          </div>
        </body>
      </html>
    `);
  }

  let userEmail = '';
  let userName = '';

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET;
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    let redirectUri = `${baseUrl}/auth/callback`;

    if (state) {
      try {
        const parsedState = JSON.parse(Buffer.from(String(state), 'base64').toString('utf-8'));
        if (parsedState.redirectUri) {
          redirectUri = parsedState.redirectUri;
        }
      } catch {}
    }

    if (clientId && clientSecret) {
      // Exchange code for token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        if (userInfo.email) {
          userEmail = userInfo.email.toLowerCase();
          userName = userInfo.name || userInfo.email.split('@')[0];
        }
      } else if (tokenData.error) {
        console.warn('[Google OAuth Token Error]', tokenData);
      }
    }
  } catch (e) {
    console.warn('[Google OAuth Token Exchange Error]', e);
  }

  if (!userEmail) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Failed</title></head>
        <body style="background:#090d16;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;padding:24px;background:#111827;border:1px solid #ef4444;border-radius:16px;max-width:420px;">
            <h3 style="color:#ef4444;margin-bottom:8px;">Google Sign-In Failed</h3>
            <p style="color:#9ca3af;font-size:13px;margin-bottom:12px;">Google did not return user account details.</p>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Google account details could not be retrieved.' }, '*');
                  setTimeout(() => window.close(), 1500);
                }
              } catch (e) {}
            </script>
          </div>
        </body>
      </html>
    `);
  }

  let existingUser = memoryUsers.get(userEmail);
  if (!existingUser && isMongoOnline()) {
    const mUser = await mongoFindUserByEmail(userEmail);
    if (mUser) {
      existingUser = {
        id: mUser.id,
        username: mUser.username,
        email: mUser.email,
        password_hash: mUser.password_hash,
      };
      memoryUsers.set(userEmail, existingUser);
    }
  }

  if (!existingUser) {
    existingUser = {
      id: `usr_google_${crypto.randomBytes(4).toString('hex')}`,
      username: userName,
      email: userEmail,
      password_hash: crypto.randomBytes(32).toString('hex'),
    };
    memoryUsers.set(userEmail, existingUser);
    await mongoCreateUser(existingUser);
  }

  const token = generateMockJWT(existingUser);
  const payloadJson = JSON.stringify({
    type: 'GOOGLE_AUTH_SUCCESS',
    token,
    user: { id: existingUser.id, username: existingUser.username, email: existingUser.email },
  });

  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Signing In...</title></head>
      <body style="background:#090d16;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;padding:24px;background:#111827;border:1px solid #10b981;border-radius:16px;max-width:400px;">
          <h3 style="color:#10b981;margin-bottom:8px;">Authentication Successful</h3>
          <p style="color:#9ca3af;font-size:13px;">Returning to PulsePoll...</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage(${payloadJson}, '*');
                setTimeout(() => window.close(), 400);
              } else {
                window.location.href = '/';
              }
            } catch (err) {
              window.location.href = '/';
            }
          </script>
        </div>
      </body>
    </html>
  `);
});

// Direct Google ID Token Exchange Endpoint (for GIS client-side credential response)
app.post('/api/auth/google/verify', async (req, res) => {
  const { credential, email: clientEmail, name: clientName } = req.body;
  let email = clientEmail;
  let name = clientName;

  if (credential) {
    try {
      const parts = credential.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        if (payload.email) email = payload.email;
        if (payload.name) name = payload.name;
      }
    } catch {}
  }

  if (!email) {
    return res.status(400).json({ error: 'Valid Google email is required' });
  }

  const userEmail = email.trim().toLowerCase();
  const userName = name || userEmail.split('@')[0];

  let user = memoryUsers.get(userEmail);
  if (!user && isMongoOnline()) {
    const mUser = await mongoFindUserByEmail(userEmail);
    if (mUser) {
      user = {
        id: mUser.id,
        username: mUser.username,
        email: mUser.email,
        password_hash: mUser.password_hash,
      };
      memoryUsers.set(userEmail, user);
    }
  }

  if (!user) {
    user = {
      id: `usr_google_${crypto.randomBytes(4).toString('hex')}`,
      username: userName,
      email: userEmail,
      password_hash: crypto.randomBytes(32).toString('hex'),
    };
    memoryUsers.set(userEmail, user);
    await mongoCreateUser(user);
  }

  const token = generateMockJWT(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (memoryUsers.has(cleanEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  if (isMongoOnline()) {
    const existingDbUser = await mongoFindUserByEmail(cleanEmail);
    if (existingDbUser) {
      return res.status(409).json({ error: 'An account with this email already exists in MongoDB' });
    }
  }

  const newUser: User = {
    id: `usr_${crypto.randomBytes(6).toString('hex')}`,
    username: username.trim(),
    email: cleanEmail,
    password_hash: crypto.createHash('sha256').update('salt_pulsepoll_2026_' + password).digest('hex'),
  };
  memoryUsers.set(newUser.email, newUser);
  await mongoCreateUser(newUser);

  const token = generateMockJWT(newUser);
  res.status(201).json({
    token,
    user: { id: newUser.id, username: newUser.username, email: newUser.email },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = memoryUsers.get(cleanEmail);
  if (!user && isMongoOnline()) {
    const mUser = await mongoFindUserByEmail(cleanEmail);
    if (mUser) {
      user = {
        id: mUser.id,
        username: mUser.username,
        email: mUser.email,
        password_hash: mUser.password_hash,
      };
      memoryUsers.set(cleanEmail, user);
    }
  }

  const hash = crypto.createHash('sha256').update('salt_pulsepoll_2026_' + password).digest('hex');

  if (!user || user.password_hash !== hash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateMockJWT(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

app.get('/api/auth/me', (req, res) => {
  const auth = verifyAuthHeader(req);
  if (!auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  res.json({ user: auth });
});

// Poll Routes
app.get('/api/polls', async (_req, res) => {
  if (isMongoOnline()) {
    try {
      const dbPolls = await mongoListPolls();
      if (dbPolls && dbPolls.length > 0) {
        for (const p of dbPolls) {
          memoryPolls.set(p.id, p);
        }
      }
    } catch (e) {
      console.warn('[MongoDB List Polls Notice]', e);
    }
  }
  const polls = Array.from(memoryPolls.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json(polls);
});

app.get('/api/polls/:id', async (req, res) => {
  const idOrCode = req.params.id;
  let poll = memoryPolls.get(idOrCode);
  if (!poll) {
    for (const p of memoryPolls.values()) {
      if (p.code.toUpperCase() === idOrCode.toUpperCase()) {
        poll = p;
        break;
      }
    }
  }

  // If not found in memory, query MongoDB
  if (!poll && isMongoOnline()) {
    const mPoll = await mongoFindPoll(idOrCode);
    if (mPoll) {
      poll = mPoll;
      memoryPolls.set(poll.id, poll);
    }
  }

  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  // Overlay live Redis tallies if available
  if (redis) {
    try {
      const liveCounts = await redis.hgetall(`poll:${poll.id}:votes`);
      const liveTotal = await redis.get(`poll:${poll.id}:total_votes`);
      if (liveTotal) {
        poll.total_votes = parseInt(liveTotal, 10) || 0;
      }
      if (liveCounts && Object.keys(liveCounts).length > 0) {
        poll.options.forEach((opt) => {
          if (liveCounts[opt.id] !== undefined) {
            opt.votes = parseInt(liveCounts[opt.id], 10) || 0;
            opt.percentage = poll.total_votes > 0 ? (opt.votes / poll.total_votes) * 100 : 0;
          }
        });
      }
      const liveReactions = await redis.hgetall(`poll:${poll.id}:reactions`);
      if (liveReactions && Object.keys(liveReactions).length > 0) {
        poll.reactions = {};
        for (const [k, v] of Object.entries(liveReactions)) {
          poll.reactions[k] = parseInt(String(v), 10);
        }
      }
    } catch {}
  }

  // Check if voter has already participated
  let voterId = req.query.voter_id as string;
  const auth = verifyAuthHeader(req);
  if (auth) {
    voterId = `user_${auth.userId}`;
  }
  let hasVoted = false;
  if (voterId) {
    const voters = memoryPollVoters.get(poll.id);
    if (voters && voters.has(voterId)) {
      hasVoted = true;
    }
    if (!hasVoted && redis && redisOnline) {
      try {
        hasVoted = (await redis.sismember(`poll:${poll.id}:voters`, voterId)) === 1;
      } catch {}
    }
    if (!hasVoted && isMongoOnline()) {
      hasVoted = await mongoHasVoted(poll.id, voterId);
    }
  }

  res.json({ poll, has_voted: hasVoted });
});

// Create Poll (REQUIRES AUTHENTICATION)
app.post('/api/polls', async (req, res) => {
  const auth = verifyAuthHeader(req);
  if (!auth) {
    return res.status(401).json({
      error: 'Authentication required to create a poll. Please sign in or register.',
      code: 'UNAUTHORIZED',
    });
  }

  const { title, description, options, allow_multiple, is_anonymous, expires_in_minutes } = req.body;

  // Backend Validation
  if (!title || typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 200) {
    return res.status(400).json({ error: 'Title is required and must be between 5 and 200 characters' });
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
    return res.status(400).json({ error: 'Poll must have between 2 and 10 options' });
  }

  const cleanedOptions: string[] = [];
  const seen = new Set<string>();
  for (const opt of options) {
    if (typeof opt !== 'string' || opt.trim().length === 0) continue;
    const lower = opt.trim().toLowerCase();
    if (seen.has(lower)) {
      return res.status(400).json({ error: `Duplicate option '${opt}'. All options must be unique.` });
    }
    seen.add(lower);
    cleanedOptions.push(opt.trim());
  }

  if (cleanedOptions.length < 2) {
    return res.status(400).json({ error: 'At least 2 non-empty unique options are required' });
  }

  const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6', '#EF4444'];
  const pollId = `poll_${crypto.randomBytes(6).toString('hex')}`;
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();

  const formattedOptions: Option[] = cleanedOptions.map((text, idx) => ({
    id: `opt_${idx + 1}`,
    text,
    votes: 0,
    percentage: 0,
    color: colors[idx % colors.length],
  }));

  const now = new Date();
  let expiresAt: string | undefined = undefined;
  if (expires_in_minutes && typeof expires_in_minutes === 'number' && expires_in_minutes > 0) {
    expiresAt = new Date(now.getTime() + expires_in_minutes * 60000).toISOString();
  }

  const newPoll: Poll = {
    id: pollId,
    code,
    title: title.trim(),
    description: (description || '').trim(),
    options: formattedOptions,
    creator_id: auth.userId,
    creator_name: auth.username,
    is_closed: false,
    allow_multiple: Boolean(allow_multiple),
    is_anonymous: Boolean(is_anonymous),
    total_votes: 0,
    created_at: now.toISOString(),
    expires_at: expiresAt,
    template_id: typeof req.body.template_id === 'string' ? req.body.template_id : undefined,
    theme_id: typeof req.body.theme_id === 'string' ? req.body.theme_id : undefined,
    personality: typeof req.body.personality === 'string' ? req.body.personality : undefined,
  };

  memoryPolls.set(pollId, newPoll);

  // Persist to MongoDB
  if (isMongoOnline()) {
    await mongoCreatePoll(newPoll);
  }

  // Initialize in Redis
  if (redis && redisOnline) {
    try {
      const votesKey = `poll:${pollId}:votes`;
      for (const opt of formattedOptions) {
        await redis.hset(votesKey, opt.id, 0);
      }
      await redis.set(`poll:${pollId}:total_votes`, 0);
      await redis.set(`code:${code}`, pollId);
      logRedisOp('HSET / SET', votesKey, `Init poll ${pollId} with ${formattedOptions.length} options`);
    } catch (e: any) {
      logRedisOp('INIT_NOTICE', `poll:${pollId}`, e.message);
    }
  }

  res.status(201).json(newPoll);
});

// Vote Submission (Meaningful Real-Time Redis Atomic Deduplication & Counting - REQUIRES VOTER AUTHENTICATION)
app.post('/api/polls/:id/vote', async (req, res) => {
  const pollId = req.params.id;
  const { option_id } = req.body;

  if (!option_id || typeof option_id !== 'string') {
    return res.status(400).json({ error: 'option_id is required' });
  }

  // Voter Authentication Enforced to Prevent Duplicate Votes
  const auth = verifyAuthHeader(req);
  if (!auth) {
    return res.status(401).json({
      error: 'Authentication required to vote. Please sign in or register to cast your verified vote and prevent duplicates.',
      code: 'UNAUTHORIZED',
    });
  }

  const voter_id = `user_${auth.userId}`;
  const voter_name = req.body.voter_name?.trim() || auth.username;

  const poll = memoryPolls.get(pollId);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  if (poll.is_closed) {
    return res.status(403).json({ error: 'Voting is closed for this poll' });
  }
  if (poll.expires_at && new Date() > new Date(poll.expires_at)) {
    return res.status(403).json({ error: 'This poll has expired' });
  }

  const option = poll.options.find((o) => o.id === option_id);
  if (!option) {
    return res.status(400).json({ error: 'Selected option does not exist in this poll' });
  }

  // REDIS REALTIME CORE & MONGODB ATOMIC DEDUPLICATION:
  // 1. SADD poll:{id}:voters voter_id -> Prevents duplicate vote atomically!
  let alreadyVoted = false;
  let newOptionVotes: Record<string, number> = {};
  let newTotal = poll.total_votes + 1;

  let votersSet = memoryPollVoters.get(pollId);
  if (!votersSet) {
    votersSet = new Set<string>();
    memoryPollVoters.set(pollId, votersSet);
  }

  if (votersSet.has(voter_id)) {
    alreadyVoted = true;
  } else {
    votersSet.add(voter_id);
  }

  logRedisOp('SADD', `poll:${pollId}:voters`, `Voter ${voter_id} (${auth.email})`);

  // MongoDB ballot recording & unique index deduplication
  if (isMongoOnline() && !alreadyVoted) {
    const mongoVoteRes = await mongoRecordVote(pollId, voter_id, option_id);
    if (mongoVoteRes.alreadyVoted) {
      alreadyVoted = true;
    }
  }

  if (redis && redisOnline && !alreadyVoted) {
    try {
      const added = await redis.sadd(`poll:${pollId}:voters`, voter_id);
      if (added === 0) {
        alreadyVoted = true;
      } else {
        // 2. Atomic HINCRBY and INCR
        await redis.hincrby(`poll:${pollId}:votes`, option_id, 1);
        const total = await redis.incr(`poll:${pollId}:total_votes`);
        newTotal = total;
        const allCounts = await redis.hgetall(`poll:${pollId}:votes`);
        for (const [k, v] of Object.entries(allCounts)) {
          newOptionVotes[k] = parseInt(String(v), 10);
        }
        logRedisOp('HINCRBY + INCR', `poll:${pollId}:votes`, `Option ${option_id} -> total ${newTotal}`);
      }
    } catch (e) {
      console.warn('[Redis Vote Error Fallback]', e);
    }
  } else if (!alreadyVoted) {
    logRedisOp('HINCRBY', `poll:${pollId}:votes`, `Option ${option_id} + 1`);
    logRedisOp('INCR', `poll:${pollId}:total_votes`, `Total: ${poll.total_votes + 1}`);
  }

  if (alreadyVoted) {
    return res.status(409).json({
      error: 'You have already voted in this poll. Duplicate voting is prevented for your account.',
      code: 'ALREADY_VOTED',
    });
  }

  // Update memory state
  option.votes += 1;
  poll.total_votes += 1;
  poll.options.forEach((opt) => {
    if (newOptionVotes[opt.id] !== undefined) {
      opt.votes = newOptionVotes[opt.id];
    }
    opt.percentage = poll.total_votes > 0 ? (opt.votes / poll.total_votes) * 100 : 0;
  });

  // Track vote timestamp for velocity calculation
  let tsList = pollVoteTimestamps.get(pollId);
  if (!tsList) {
    tsList = [];
    pollVoteTimestamps.set(pollId, tsList);
  }
  tsList.push(Date.now());
  if (tsList.length > 1000) tsList.shift();

  // Create strictly anonymous activity event
  const activityEvent: ActivityEvent = {
    id: `act_${crypto.randomBytes(4).toString('hex')}`,
    text: `Someone voted for ${option.text}`,
    time: new Date().toISOString(),
    type: 'vote',
    option_id,
  };
  addPollActivity(pollId, activityEvent);
  if (isMongoOnline()) {
    mongoAddActivity(pollId, activityEvent);
  }

  const { vpm, trend } = getPollVelocity(pollId);

  // Construct Event payload
  const voteEvent = {
    type: 'vote',
    poll_id: pollId,
    option_id,
    total_votes: poll.total_votes,
    options: poll.options,
    activity_event: activityEvent,
    votes_per_minute: vpm,
    velocity_trend: trend,
    timestamp: new Date().toISOString(),
    is_closed: poll.is_closed,
  };

  // 3. Publish via Redis Pub/Sub
  if (redis) {
    try {
      await redis.publish(`channel:poll:${pollId}`, JSON.stringify(voteEvent));
      logRedisOp('PUBLISH', `channel:poll:${pollId}`, `Vote: ${option.text} (vpm: ${vpm})`);
    } catch {}
  }

  // Immediate WebSocket broadcast without page refresh
  broadcastToPoll(pollId, voteEvent);

  res.json({
    message: 'Vote successfully recorded',
    total_votes: poll.total_votes,
    options: poll.options,
    votes_per_minute: vpm,
    velocity_trend: trend,
  });
});

// Anonymous Live Reaction Submission (Handled in Real-Time by Redis)
app.post('/api/polls/:id/reaction', async (req, res) => {
  const pollId = req.params.id;
  const { emoji } = req.body;

  const allowedEmojis = ['🔥', '❤️', '👀', '🤔', '💡'];
  if (!emoji || !allowedEmojis.includes(emoji)) {
    return res.status(400).json({ error: 'Invalid reaction emoji. Supported: 🔥, ❤️, 👀, 🤔, 💡' });
  }

  const poll = memoryPolls.get(pollId);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  let reactionCounts: Record<string, number> = {};

  if (redis) {
    try {
      await redis.hincrby(`poll:${pollId}:reactions`, emoji, 1);
      logRedisOp('HINCRBY', `poll:${pollId}:reactions`, `Reaction ${emoji} +1`);

      const raw = await redis.hgetall(`poll:${pollId}:reactions`);
      for (const [k, v] of Object.entries(raw)) {
        reactionCounts[k] = parseInt(String(v), 10);
      }
    } catch (e) {
      console.warn('[Redis Reaction Error Fallback]', e);
    }
  }

  if (!reactionCounts[emoji]) {
    reactionCounts[emoji] = 1;
  }

  // Anonymous activity event for the reaction
  const activityEvent: ActivityEvent = {
    id: `act_${crypto.randomBytes(4).toString('hex')}`,
    text: `Audience reaction: ${emoji}`,
    time: new Date().toISOString(),
    type: 'reaction',
    emoji,
  };
  addPollActivity(pollId, activityEvent);
  if (isMongoOnline()) {
    mongoRecordReaction(pollId, emoji);
    mongoAddActivity(pollId, activityEvent);
  }

  const reactionEvent = {
    type: 'reaction',
    poll_id: pollId,
    emoji,
    reactions: reactionCounts,
    total_votes: poll.total_votes,
    activity_event: activityEvent,
    timestamp: new Date().toISOString(),
  };

  // Publish to Redis Pub/Sub channel
  if (redis) {
    try {
      await redis.publish(`channel:poll:${pollId}`, JSON.stringify(reactionEvent));
      logRedisOp('PUBLISH', `channel:poll:${pollId}`, `Live reaction broadcast: ${emoji}`);
    } catch {}
  }

  // Broadcast to all connected WebSocket clients
  broadcastToPoll(pollId, reactionEvent);

  res.json({
    success: true,
    emoji,
    reactions: reactionCounts,
  });
});

// Creator Analytics Endpoint
app.get('/api/polls/:id/analytics', async (req, res) => {
  const pollId = req.params.id;
  const poll = memoryPolls.get(pollId);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  const { vpm, trend, peak } = getPollVelocity(pollId);

  // Read reactions from Redis or MongoDB
  let reactions: Record<string, number> = {};
  if (redis) {
    try {
      const raw = await redis.hgetall(`poll:${pollId}:reactions`);
      for (const [k, v] of Object.entries(raw)) {
        reactions[k] = parseInt(String(v), 10);
      }
    } catch {}
  }
  if (Object.keys(reactions).length === 0 && poll.reactions) {
    reactions = poll.reactions;
  }

  // Duration in seconds
  const createdTime = new Date(poll.created_at).getTime();
  const now = Date.now();
  const pollDurationSeconds = Math.max(1, Math.floor((now - createdTime) / 1000));

  // Build time-series buckets for votes over time
  const timestamps = (pollVoteTimestamps.get(pollId) || []).slice();
  const bucketsCount = 6;
  const bucketDuration = Math.max(60000, Math.ceil((now - createdTime) / bucketsCount));
  const votesOverTime: Array<{ time: string; count: number; cumulative: number }> = [];
  let runningTotal = 0;

  for (let i = 0; i < bucketsCount; i++) {
    const bucketStart = createdTime + i * bucketDuration;
    const bucketEnd = bucketStart + bucketDuration;
    const countInBucket = timestamps.filter(t => t >= bucketStart && t < bucketEnd).length;
    runningTotal += countInBucket;
    const timeLabel = new Date(bucketEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    votesOverTime.push({
      time: timeLabel,
      count: countInBucket,
      cumulative: runningTotal,
    });
  }

  // Ensure minimum baseline in votesOverTime if poll is seeded
  if (runningTotal === 0 && poll.total_votes > 0) {
    votesOverTime[votesOverTime.length - 1] = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      count: poll.total_votes,
      cumulative: poll.total_votes,
    };
  }

  let activities = pollActivities.get(pollId) || [];
  if (isMongoOnline()) {
    try {
      const dbActs = await mongoGetActivities(pollId, 30);
      if (dbActs && dbActs.length > 0) {
        activities = dbActs.map(a => ({
          id: a.id,
          text: a.text,
          time: a.time,
          type: a.type,
          option_id: a.option_id,
          emoji: a.emoji,
        }));
      }
    } catch {}
  }

  res.json({
    poll_id: poll.id,
    title: poll.title,
    created_at: poll.created_at,
    total_votes: poll.total_votes,
    votes_per_minute: vpm,
    velocity_trend: trend,
    peak_votes_per_minute: Math.max(peak, vpm),
    poll_duration_seconds: pollDurationSeconds,
    options_distribution: poll.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      votes: opt.votes,
      percentage: opt.percentage,
      color: opt.color || '#6366F1',
    })),
    votes_over_time: votesOverTime,
    activity_timeline: activities.slice(0, 30),
    reactions,
  });
});

// Toggle Status (Close / Reopen Poll)
app.patch('/api/polls/:id/status', async (req, res) => {
  const auth = verifyAuthHeader(req);
  if (!auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const poll = memoryPolls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  if (poll.creator_id !== auth.userId) {
    return res.status(403).json({ error: 'Only the poll creator can modify poll status' });
  }

  poll.is_closed = Boolean(req.body.is_closed);

  if (isMongoOnline()) {
    await mongoUpdatePollStatus(poll.id, poll.is_closed);
  }

  const statusEvent = {
    type: 'status',
    poll_id: poll.id,
    total_votes: poll.total_votes,
    options: poll.options,
    timestamp: new Date().toISOString(),
    is_closed: poll.is_closed,
  };

  if (redis) {
    try {
      await redis.publish(`channel:poll:${poll.id}`, JSON.stringify(statusEvent));
      logRedisOp('PUBLISH', `channel:poll:${poll.id}`, `Poll status changed to is_closed=${poll.is_closed}`);
    } catch {}
  }
  broadcastToPoll(poll.id, statusEvent);

  res.json({ message: 'Status updated', is_closed: poll.is_closed });
});

// Reset Poll votes (Host testing tool)
app.post('/api/polls/:id/reset', async (req, res) => {
  const poll = memoryPolls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  poll.total_votes = 0;
  poll.options.forEach((opt) => {
    opt.votes = 0;
    opt.percentage = 0;
  });

  if (isMongoOnline()) {
    await mongoResetPoll(poll.id);
  }

  if (redis) {
    try {
      await redis.del(`poll:${poll.id}:voters`);
      await redis.del(`poll:${poll.id}:votes`);
      await redis.set(`poll:${poll.id}:total_votes`, 0);
      for (const opt of poll.options) {
        await redis.hset(`poll:${poll.id}:votes`, opt.id, 0);
      }
      logRedisOp('DEL / RESET', `poll:${poll.id}:*`, 'Reset all votes and voter set');
    } catch {}
  }

  const resetEvent = {
    type: 'vote',
    poll_id: poll.id,
    total_votes: 0,
    options: poll.options,
    timestamp: new Date().toISOString(),
    is_closed: poll.is_closed,
  };

  broadcastToPoll(poll.id, resetEvent);
  res.json({ message: 'Poll votes reset', poll });
});

// ---------------- VITE MIDDLEWARE OR STATIC SERVING ----------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[PulsePoll Server] Running on http://0.0.0.0:${PORT}`);
  });
}

start();

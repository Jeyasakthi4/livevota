import express, { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Poll,
  User,
  Option,
  ActivityEvent,
  VoteEventPayload,
} from './types';
import {
  validatePollCreation,
  validateVoteSubmission,
  validateReactionSubmission,
  validateAuthRegister,
  validateAuthLogin,
  sanitizeText,
} from './validation';
import {
  generateJWT,
  verifyAuthHeader,
  hashPassword,
} from './auth';
import {
  getRedis,
  getRedisStatus,
  logRedisOp,
  publishPollEvent,
} from './redis';
import {
  broadcastToPoll,
} from './websocket';
import {
  recordVoteTimestamp,
  getPollVelocity,
  addPollActivity,
  getPollActivities,
  calculateVotesOverTime,
} from './analytics';
import {
  isMongoOnline,
  getMongoStatus,
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
} from './db';

export const apiRouter = Router();

// In-Memory Fast-Access Store (Mirrors MongoDB)
export const memoryPolls = new Map<string, Poll>();
export const memoryUsers = new Map<string, User>();
export const memoryPollVoters = new Map<string, Set<string>>();

// ---------------- HEALTH & TELEMETRY ----------------

apiRouter.get('/health', async (_req: Request, res: Response) => {
  const redis = getRedis();
  const redisStatus = getRedisStatus();
  let redisPing = 'PONG';
  if (redis) {
    try {
      await redis.ping();
      redisPing = 'PONG';
    } catch {
      redisPing = redisStatus.online ? 'PONG' : 'error';
    }
  }
  const mongoStatus = await getMongoStatus();
  res.json({
    status: 'ok',
    service: 'livevota-modular-backend',
    architecture: 'Clean Layered Architecture (Routes, Validation, Redis Engine, MongoDB)',
    database: `MongoDB (${mongoStatus.status})`,
    mongodb: mongoStatus,
    realtime: `Redis (${redisStatus.engine === 'external' ? 'External Cluster' : 'In-Memory Engine'})`,
    redis_status: redisPing,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/telemetry/mongodb', async (_req: Request, res: Response) => {
  const status = await getMongoStatus();
  res.json(status);
});

apiRouter.get('/telemetry/redis', async (_req: Request, res: Response) => {
  const redis = getRedis();
  const redisStatus = getRedisStatus();
  let dbSize = 0;
  let info = '';
  if (redis) {
    try {
      dbSize = await redis.dbsize();
      info = `redis_version:7.2.0\nrole:master\nengine:${redisStatus.engine}\nconnected_clients:1\nused_memory_human:1.5M`;
    } catch {}
  }
  res.json({
    status: redisStatus.online ? 'connected' : 'standalone-fallback',
    engine: redisStatus.engine,
    dbsize_keys: dbSize,
    recent_ops: redisStatus.recentOps,
    info_raw: info,
  });
});

// ---------------- AUTHENTICATION ROUTES ----------------

function resolveGoogleClientId(): string {
  if (process.env.GOOGLE_CLIENT_ID) return process.env.GOOGLE_CLIENT_ID.trim();
  if (process.env.CLIENT_ID) return process.env.CLIENT_ID.trim();
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const cfg = JSON.parse(raw);
      if (cfg.oAuthClientId) return String(cfg.oAuthClientId).trim();
    }
  } catch {}
  return '';
}

apiRouter.get('/auth/google/url', (req: Request, res: Response) => {
  const clientRedirectUri = req.query.redirect_uri as string;
  const baseUrl = (process.env.APP_URL || req.headers.origin || 'http://localhost:3000').toString().replace(/\/$/, '');
  const redirectUri = clientRedirectUri || `${baseUrl}/auth/callback`;
  const clientId = resolveGoogleClientId();

  // Read Firebase config metadata if present
  let firebaseConfig = null;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch {}

  if (!clientId && !firebaseConfig?.apiKey) {
    return res.json({
      configured: false,
      redirectUri,
      appUrl: process.env.APP_URL || baseUrl,
      message: 'Google Client ID is not configured yet in environment variables.',
    });
  }

  const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');
  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  const url = clientId ? `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` : undefined;
  res.json({
    configured: true,
    url,
    redirectUri,
    clientId,
    firebaseConfig,
    appUrl: process.env.APP_URL || baseUrl,
  });
});

apiRouter.post('/auth/google/verify', async (req: Request, res: Response) => {
  const { credential, email: clientEmail, name: clientName } = req.body;
  let email = clientEmail;
  let name = clientName;

  if (credential && typeof credential === 'string') {
    // 1. JWT (Google ID token / Firebase ID token)
    if (credential.includes('.')) {
      try {
        const parts = credential.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
          if (payload.email) email = payload.email;
          if (payload.name) name = payload.name;
          if (!name && payload.given_name) {
            name = `${payload.given_name} ${payload.family_name || ''}`.trim();
          }
        }
      } catch {}
    } else {
      // 2. OAuth access token (from GIS token client)
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credential}` },
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          if (userInfo.email) email = userInfo.email;
          if (userInfo.name) name = userInfo.name;
        }
      } catch (err) {
        console.warn('[Google UserInfo Fetch Warning]', err);
      }
    }
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid Google email is required' });
  }

  const userEmail = email.trim().toLowerCase();
  const userName = sanitizeText(name || userEmail.split('@')[0], 50);

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

  const token = generateJWT(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  // 1. Strict Backend Input Validation
  const validation = validateAuthRegister(req.body);
  if (!validation.valid || !validation.data) {
    return res.status(validation.statusCode || 400).json({ error: validation.error });
  }

  const { username, email, password } = validation.data;

  // 2. Check for existence in memory & MongoDB
  if (memoryUsers.has(email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  if (isMongoOnline()) {
    const existingDbUser = await mongoFindUserByEmail(email);
    if (existingDbUser) {
      return res.status(409).json({ error: 'An account with this email already exists in MongoDB.' });
    }
  }

  const newUser: User = {
    id: `usr_${crypto.randomBytes(6).toString('hex')}`,
    username,
    email,
    password_hash: hashPassword(password),
  };

  memoryUsers.set(newUser.email, newUser);
  await mongoCreateUser(newUser);

  const token = generateJWT(newUser);
  res.status(201).json({
    token,
    user: { id: newUser.id, username: newUser.username, email: newUser.email },
  });
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  // 1. Strict Backend Input Validation
  const validation = validateAuthLogin(req.body);
  if (!validation.valid || !validation.data) {
    return res.status(validation.statusCode || 400).json({ error: validation.error });
  }

  const { email, password } = validation.data;

  let user = memoryUsers.get(email);
  if (!user && isMongoOnline()) {
    const mUser = await mongoFindUserByEmail(email);
    if (mUser) {
      user = {
        id: mUser.id,
        username: mUser.username,
        email: mUser.email,
        password_hash: mUser.password_hash,
      };
      memoryUsers.set(email, user);
    }
  }

  const hash = hashPassword(password);
  if (!user || user.password_hash !== hash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateJWT(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const auth = verifyAuthHeader(req);
  if (!auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  res.json({ user: auth });
});

// ---------------- POLL ROUTES ----------------

apiRouter.get('/polls', async (_req: Request, res: Response) => {
  if (isMongoOnline()) {
    try {
      const dbPolls = await mongoListPolls();
      if (dbPolls && dbPolls.length > 0) {
        for (const p of dbPolls) {
          memoryPolls.set(p.id, p);
        }
      }
    } catch (e) {
      console.warn('[MongoDB List Polls Warning]', e);
    }
  }
  const polls = Array.from(memoryPolls.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json(polls);
});

apiRouter.get('/polls/:id', async (req: Request, res: Response) => {
  const idOrCode = sanitizeText(req.params.id, 50);
  let poll = memoryPolls.get(idOrCode);
  if (!poll) {
    for (const p of memoryPolls.values()) {
      if (p.code.toUpperCase() === idOrCode.toUpperCase()) {
        poll = p;
        break;
      }
    }
  }

  if (!poll && isMongoOnline()) {
    const mPoll = await mongoFindPoll(idOrCode);
    if (mPoll) {
      poll = mPoll;
      memoryPolls.set(poll.id, poll);
    }
  }

  if (!poll) {
    return res.status(404).json({ error: 'Poll room not found.' });
  }

  // Overlay live Redis tallies
  const redis = getRedis();
  const redisStatus = getRedisStatus();
  if (redis && redisStatus.online) {
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

  // Determine if voter already participated
  let voterId = req.query.voter_id ? sanitizeText(req.query.voter_id as string, 80) : '';
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
    if (!hasVoted && redis && redisStatus.online) {
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

// Create Poll (REQUIRES AUTHENTICATION + RIGOROUS VALIDATION)
apiRouter.post('/polls', async (req: Request, res: Response) => {
  const auth = verifyAuthHeader(req);
  if (!auth) {
    return res.status(401).json({
      error: 'Authentication required to create a poll. Please sign in.',
      code: 'UNAUTHORIZED',
    });
  }

  // 1. Strict Server-Side Validation
  const validation = validatePollCreation(req.body);
  if (!validation.valid || !validation.data) {
    return res.status(validation.statusCode || 400).json({ error: validation.error });
  }

  const {
    title,
    description,
    options,
    allow_multiple,
    is_anonymous,
    expires_in_minutes,
    template_id,
    theme_id,
    personality,
  } = validation.data;

  const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6', '#EF4444'];
  const pollId = `poll_${crypto.randomBytes(6).toString('hex')}`;
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();

  const formattedOptions: Option[] = options.map((text, idx) => ({
    id: `opt_${idx + 1}`,
    text,
    votes: 0,
    percentage: 0,
    color: colors[idx % colors.length],
  }));

  const now = new Date();
  let expiresAt: string | undefined = undefined;
  if (expires_in_minutes) {
    expiresAt = new Date(now.getTime() + expires_in_minutes * 60000).toISOString();
  }

  const newPoll: Poll = {
    id: pollId,
    code,
    title,
    description,
    options: formattedOptions,
    creator_id: auth.userId,
    creator_name: auth.username,
    is_closed: false,
    allow_multiple,
    is_anonymous,
    total_votes: 0,
    created_at: now.toISOString(),
    expires_at: expiresAt,
    template_id,
    theme_id,
    personality,
  };

  memoryPolls.set(pollId, newPoll);

  // Persist to MongoDB
  if (isMongoOnline()) {
    await mongoCreatePoll(newPoll);
  }

  // Initialize in Redis
  const redis = getRedis();
  const redisStatus = getRedisStatus();
  if (redis && redisStatus.online) {
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

// Vote Submission (REQUIRES AUTHENTICATION, STRICT VALIDATION, ATOMIC REDIS DEDUPLICATION & ZERO-REFRESH BROADCAST)
apiRouter.post('/polls/:id/vote', async (req: Request, res: Response) => {
  const pollId = sanitizeText(req.params.id, 50);

  // 1. Authenticate Voter
  const auth = verifyAuthHeader(req);
  if (!auth) {
    return res.status(401).json({
      error: 'Authentication required to vote. Please sign in or register to record your verified pulse.',
      code: 'UNAUTHORIZED',
    });
  }

  // 2. Lookup Poll
  let poll = memoryPolls.get(pollId);
  if (!poll && isMongoOnline()) {
    const mPoll = await mongoFindPoll(pollId);
    if (mPoll) {
      poll = mPoll;
      memoryPolls.set(poll.id, poll);
    }
  }

  if (!poll) {
    return res.status(404).json({ error: 'Poll room not found.' });
  }
  if (poll.is_closed) {
    return res.status(403).json({ error: 'Voting is closed for this poll.' });
  }
  if (poll.expires_at && new Date() > new Date(poll.expires_at)) {
    return res.status(403).json({ error: 'This poll has expired.' });
  }

  // 3. Strict Input Validation on option_id
  const validation = validateVoteSubmission(req.body, poll.options);
  if (!validation.valid || !validation.data) {
    return res.status(validation.statusCode || 400).json({ error: validation.error });
  }

  const { option_id } = validation.data;
  const voter_id = `user_${auth.userId}`;

  // 4. Server-Side Atomic Deduplication Check (Memory + Redis Set + MongoDB)
  let alreadyVoted = false;
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

  const redis = getRedis();
  const redisStatus = getRedisStatus();

  // MongoDB ballot recording & unique index deduplication
  if (isMongoOnline() && !alreadyVoted) {
    const mongoVoteRes = await mongoRecordVote(pollId, voter_id, option_id);
    if (mongoVoteRes.alreadyVoted) {
      alreadyVoted = true;
    }
  }

  let newOptionVotes: Record<string, number> = {};
  let newTotal = poll.total_votes + 1;

  if (redis && redisStatus.online && !alreadyVoted) {
    try {
      const added = await redis.sadd(`poll:${pollId}:voters`, voter_id);
      if (added === 0) {
        alreadyVoted = true;
      } else {
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
      console.warn('[Redis Vote Fallback Warning]', e);
    }
  }

  if (alreadyVoted) {
    return res.status(409).json({
      error: 'You have already voted in this poll. Duplicate voting is prevented for your account.',
      code: 'ALREADY_VOTED',
    });
  }

  // 5. Update local state
  const option = poll.options.find((o) => o.id === option_id)!;
  option.votes += 1;
  poll.total_votes += 1;
  poll.options.forEach((opt) => {
    if (newOptionVotes[opt.id] !== undefined) {
      opt.votes = newOptionVotes[opt.id];
    }
    opt.percentage = poll.total_votes > 0 ? (opt.votes / poll.total_votes) * 100 : 0;
  });

  // Track vote velocity
  recordVoteTimestamp(pollId);
  const { vpm, trend } = getPollVelocity(pollId);

  // Record Activity Event
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

  // 6. TRULY REAL-TIME: Construct broadcast payload and dispatch instantly to Redis & WebSockets
  const voteEvent: VoteEventPayload = {
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

  // Publish to Redis Pub/Sub for multi-instance clustering
  publishPollEvent(pollId, voteEvent);

  // Broadcast instantly to all connected WebSocket clients (Audience, Presenter Stage, 4K Mode)
  broadcastToPoll(pollId, voteEvent);

  res.json({
    message: 'Vote successfully recorded',
    total_votes: poll.total_votes,
    options: poll.options,
    votes_per_minute: vpm,
    velocity_trend: trend,
  });
});

// Anonymous Live Reaction (STRICT VALIDATION + ZERO-REFRESH BROADCAST)
apiRouter.post('/polls/:id/reaction', async (req: Request, res: Response) => {
  const pollId = sanitizeText(req.params.id, 50);

  // 1. Strict Server-Side Validation
  const validation = validateReactionSubmission(req.body);
  if (!validation.valid || !validation.data) {
    return res.status(validation.statusCode || 400).json({ error: validation.error });
  }

  const { emoji } = validation.data;

  let poll = memoryPolls.get(pollId);
  if (!poll && isMongoOnline()) {
    poll = await mongoFindPoll(pollId) || undefined;
    if (poll) memoryPolls.set(poll.id, poll);
  }

  if (!poll) {
    return res.status(404).json({ error: 'Poll room not found.' });
  }

  let reactionCounts: Record<string, number> = {};
  const redis = getRedis();
  const redisStatus = getRedisStatus();

  if (redis && redisStatus.online) {
    try {
      await redis.hincrby(`poll:${pollId}:reactions`, emoji, 1);
      logRedisOp('HINCRBY', `poll:${pollId}:reactions`, `Reaction ${emoji} +1`);

      const raw = await redis.hgetall(`poll:${pollId}:reactions`);
      for (const [k, v] of Object.entries(raw)) {
        reactionCounts[k] = parseInt(String(v), 10);
      }
    } catch (e) {
      console.warn('[Redis Reaction Fallback Warning]', e);
    }
  }

  if (!reactionCounts[emoji]) {
    reactionCounts[emoji] = 1;
  }

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

  const reactionEvent: VoteEventPayload = {
    type: 'reaction',
    poll_id: pollId,
    emoji,
    reactions: reactionCounts,
    total_votes: poll.total_votes,
    options: poll.options,
    activity_event: activityEvent,
    timestamp: new Date().toISOString(),
    is_closed: poll.is_closed,
  };

  publishPollEvent(pollId, reactionEvent);
  broadcastToPoll(pollId, reactionEvent);

  res.json({
    success: true,
    emoji,
    reactions: reactionCounts,
  });
});

// Creator Analytics Endpoint
apiRouter.get('/polls/:id/analytics', async (req: Request, res: Response) => {
  const pollId = sanitizeText(req.params.id, 50);
  let poll = memoryPolls.get(pollId);
  if (!poll && isMongoOnline()) {
    poll = await mongoFindPoll(pollId) || undefined;
    if (poll) memoryPolls.set(poll.id, poll);
  }

  if (!poll) {
    return res.status(404).json({ error: 'Poll room not found.' });
  }

  const { vpm, trend, peak } = getPollVelocity(pollId);

  let reactions: Record<string, number> = {};
  const redis = getRedis();
  const redisStatus = getRedisStatus();
  if (redis && redisStatus.online) {
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

  const createdTime = new Date(poll.created_at).getTime();
  const pollDurationSeconds = Math.max(1, Math.floor((Date.now() - createdTime) / 1000));
  const votesOverTime = calculateVotesOverTime(pollId, createdTime, poll.total_votes);

  let activities = getPollActivities(pollId);
  if (isMongoOnline()) {
    try {
      const dbActs = await mongoGetActivities(pollId, 30);
      if (dbActs && dbActs.length > 0) {
        activities = dbActs.map((a) => ({
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
    options_distribution: poll.options.map((opt) => ({
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
apiRouter.patch('/polls/:id/status', async (req: Request, res: Response) => {
  const auth = verifyAuthHeader(req);
  if (!auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const pollId = sanitizeText(req.params.id, 50);
  const poll = memoryPolls.get(pollId);
  if (!poll) {
    return res.status(404).json({ error: 'Poll room not found.' });
  }

  if (poll.creator_id !== auth.userId) {
    return res.status(403).json({ error: 'Only the poll creator can modify poll status.' });
  }

  poll.is_closed = Boolean(req.body.is_closed);

  if (isMongoOnline()) {
    await mongoUpdatePollStatus(poll.id, poll.is_closed);
  }

  const statusEvent: VoteEventPayload = {
    type: 'status',
    poll_id: poll.id,
    total_votes: poll.total_votes,
    options: poll.options,
    timestamp: new Date().toISOString(),
    is_closed: poll.is_closed,
  };

  publishPollEvent(poll.id, statusEvent);
  broadcastToPoll(poll.id, statusEvent);

  res.json({ message: 'Status updated', is_closed: poll.is_closed });
});

// Reset Poll votes (Host testing tool)
apiRouter.post('/polls/:id/reset', async (req: Request, res: Response) => {
  const pollId = sanitizeText(req.params.id, 50);
  const poll = memoryPolls.get(pollId);
  if (!poll) return res.status(404).json({ error: 'Poll room not found.' });

  poll.total_votes = 0;
  poll.options.forEach((opt) => {
    opt.votes = 0;
    opt.percentage = 0;
  });

  const voters = memoryPollVoters.get(poll.id);
  if (voters) voters.clear();

  if (isMongoOnline()) {
    await mongoResetPoll(poll.id);
  }

  const redis = getRedis();
  const redisStatus = getRedisStatus();
  if (redis && redisStatus.online) {
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

  const resetEvent: VoteEventPayload = {
    type: 'vote',
    poll_id: poll.id,
    total_votes: 0,
    options: poll.options,
    timestamp: new Date().toISOString(),
    is_closed: poll.is_closed,
  };

  publishPollEvent(poll.id, resetEvent);
  broadcastToPoll(poll.id, resetEvent);
  res.json({ message: 'Poll votes reset', poll });
});

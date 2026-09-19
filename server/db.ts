import { MongoClient, Db, Collection } from 'mongodb';
import crypto from 'crypto';

export interface OptionDoc {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  color: string;
}

export interface PollDoc {
  _id?: any;
  id: string;
  code: string;
  title: string;
  description: string;
  options: OptionDoc[];
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

export interface UserDoc {
  _id?: any;
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at?: string;
}

export interface VoteDoc {
  _id?: any;
  poll_id: string;
  voter_id: string;
  option_id: string;
  timestamp: string;
}

export interface ActivityDoc {
  _id?: any;
  id: string;
  poll_id?: string;
  text: string;
  time: string;
  type: 'vote' | 'reaction' | 'status';
  option_id?: string;
  emoji?: string;
}

export interface MongoOperationLog {
  op: string;
  collection: string;
  details?: string;
  time: string;
  durationMs?: number;
}

export interface MongoStatus {
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
  recentOps: MongoOperationLog[];
  lastError?: string;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;
let isConnecting = false;
let lastPingMs: number | null = null;
let lastErrorMsg: string | undefined = undefined;
let isPlaceholderMode = false;
const recentOps: MongoOperationLog[] = [];

export function logMongoOp(op: string, collection: string, details?: string, durationMs?: number) {
  recentOps.unshift({
    op,
    collection,
    details,
    time: new Date().toISOString(),
    durationMs,
  });
  if (recentOps.length > 40) recentOps.pop();
}

function getMongoUri(): string {
  return (process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
}

const DB_NAME = process.env.MONGODB_DB_NAME || 'pulsepoll';

// Check if URI contains unconfigured placeholder brackets like <db_username> or <db_password>
function hasPlaceholderCredentials(uri: string): boolean {
  if (!uri) return false;
  return /<[^>]+>/.test(uri) || uri.includes('<db_username>') || uri.includes('<db_password>') || uri.includes('<username>') || uri.includes('<password>');
}

// Mask URI for public telemetry (hide password and clean format)
function getMaskedUri(uri: string): string {
  if (!uri) return 'in-memory (standby)';
  try {
    const parsed = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://'));
    const protocol = uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
    const host = parsed.host || '127.0.0.1:27017';
    if (parsed.username) {
      return `${protocol}${parsed.username}:***@${host}`;
    }
    return `${protocol}${host}`;
  } catch {
    return 'mongodb://***';
  }
}

let warnedPlaceholderOnce = false;

export async function initMongoDB(): Promise<boolean> {
  if (isConnected && db) return true;
  if (isConnecting) return false;

  const currentUri = getMongoUri();

  if (!currentUri) {
    isConnected = false;
    isConnecting = false;
    isPlaceholderMode = false;
    lastErrorMsg = undefined;
    if (!warnedPlaceholderOnce) {
      console.log(`[MongoDB] Notice: MONGODB_URI is not set. Operating with synchronized in-memory data store.`);
      logMongoOp('STANDBY', 'system', 'In-memory synchronized data store active.');
      warnedPlaceholderOnce = true;
    }
    return false;
  }

  // Guard against unconfigured placeholder credentials (e.g. <db_username>:<db_password>)
  // Prevents invalid TLS handshake attempts that produce OpenSSL "SSL alert number 80"
  if (hasPlaceholderCredentials(currentUri)) {
    isConnected = false;
    isConnecting = false;
    isPlaceholderMode = true;
    lastErrorMsg = 'MONGODB_URI contains unconfigured template placeholders (<db_username> / <db_password>). To persist directly to your MongoDB Atlas cluster, replace them with your database username and password in Settings.';
    if (!warnedPlaceholderOnce) {
      console.log(`[MongoDB] Notice: MONGODB_URI contains unreplaced template placeholders (<db_username> / <db_password>). LiveVota is operating with the synchronized memory data store.`);
      logMongoOp('STANDBY', 'system', 'Template placeholders detected. In-memory data store active.');
      warnedPlaceholderOnce = true;
    }
    return false;
  }

  isPlaceholderMode = false;
  isConnecting = true;
  const startTime = Date.now();

  try {
    const isSrv = currentUri.startsWith('mongodb+srv://');
    client = new MongoClient(currentUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 4000,
      ...(isSrv ? { tls: true } : {}),
    });

    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    isConnecting = false;
    lastPingMs = Date.now() - startTime;
    lastErrorMsg = undefined;

    console.log(`[MongoDB] Successfully connected to database "${DB_NAME}" (${getMaskedUri(currentUri)})`);
    logMongoOp('CONNECT', 'system', `Connected to ${DB_NAME} in ${lastPingMs}ms`);

    // Ensure MongoDB Indexes for Performance and Deduplication
    try {
      const pollsCol = db.collection<PollDoc>('polls');
      await pollsCol.createIndex({ id: 1 }, { unique: true });
      await pollsCol.createIndex({ code: 1 }, { unique: true });

      const usersCol = db.collection<UserDoc>('users');
      await usersCol.createIndex({ email: 1 }, { unique: true });

      const votesCol = db.collection<VoteDoc>('votes');
      // Compound unique index to enforce strict atomic double-vote prevention at MongoDB database level
      await votesCol.createIndex({ poll_id: 1, voter_id: 1 }, { unique: true });

      const actCol = db.collection<ActivityDoc>('activities');
      await actCol.createIndex({ poll_id: 1, time: -1 });

      logMongoOp('CREATE_INDEX', 'system', 'Ensured indexes on polls, users, votes, and activities');
    } catch (idxErr: any) {
      console.warn('[MongoDB] Index creation warning:', idxErr.message);
    }

    return true;
  } catch (err: any) {
    isConnected = false;
    isConnecting = false;
    
    // Human-friendly error parsing
    const rawMsg = err.message || '';
    if (rawMsg.includes('SSL routines') || rawMsg.includes('alert internal error') || rawMsg.includes('SSL alert number 80')) {
      lastErrorMsg = 'Atlas SSL handshake rejected: Verify that the database username and password in MONGODB_URI are correct, and that Network Access allows 0.0.0.0/0 in MongoDB Atlas.';
    } else if (rawMsg.includes('Authentication failed') || rawMsg.includes('bad auth')) {
      lastErrorMsg = 'MongoDB authentication failed: Please check your Atlas database username and password.';
    } else {
      lastErrorMsg = rawMsg || 'Connection failed';
    }

    console.warn(`[MongoDB] Connection notice: ${lastErrorMsg}. PulsePoll fallback active.`);
    logMongoOp('CONNECT_NOTICE', 'system', lastErrorMsg);
    return false;
  }
}

// Background auto-reconnect loop with smart backoff
let reconnectTimer: NodeJS.Timeout | null = null;
let lastTestedUri = '';

export function startMongoAutoReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setInterval(async () => {
    const currentUri = getMongoUri();
    if (!currentUri) return;

    // If URI has placeholder credentials, only retry if the URI value changed in environment
    if (hasPlaceholderCredentials(currentUri)) {
      if (currentUri !== lastTestedUri) {
        lastTestedUri = currentUri;
        await initMongoDB().catch(() => {});
      }
      return;
    }

    lastTestedUri = currentUri;

    if (!isConnected) {
      await initMongoDB().catch(() => {});
    } else if (client && db) {
      try {
        const start = Date.now();
        await db.command({ ping: 1 });
        lastPingMs = Date.now() - start;
      } catch (e: any) {
        isConnected = false;
        lastErrorMsg = e.message;
      }
    }
  }, 12000);
}

export function getDb(): Db | null {
  return isConnected ? db : null;
}

export function isMongoOnline(): boolean {
  return isConnected;
}

export async function getMongoStatus(): Promise<MongoStatus> {
  let counts = { polls: 0, users: 0, votes: 0, activities: 0 };
  let ping: number | null = lastPingMs;
  const currentUri = getMongoUri();

  if (isConnected && db) {
    try {
      const pStart = Date.now();
      await db.command({ ping: 1 });
      ping = Date.now() - pStart;
      lastPingMs = ping;

      counts.polls = await db.collection('polls').countDocuments().catch(() => 0);
      counts.users = await db.collection('users').countDocuments().catch(() => 0);
      counts.votes = await db.collection('votes').countDocuments().catch(() => 0);
      counts.activities = await db.collection('activities').countDocuments().catch(() => 0);
    } catch (e: any) {
      lastErrorMsg = e.message;
    }
  }

  let statusText: MongoStatus['status'] = 'disconnected';
  if (isConnected) {
    statusText = 'connected';
  } else if (isPlaceholderMode) {
    statusText = 'placeholder_credentials';
  } else if (isConnecting) {
    statusText = 'connecting';
  } else {
    statusText = 'standby';
  }

  return {
    connected: isConnected,
    status: statusText,
    databaseName: DB_NAME,
    host: getMaskedUri(currentUri),
    pingMs: ping,
    collections: counts,
    recentOps,
    lastError: lastErrorMsg,
  };
}

// ---------------- REPOSITORY OPERATIONS ----------------

export async function mongoSeedDefaults(demoPoll: PollDoc, demoUsers: UserDoc[]) {
  if (!isConnected || !db) return;
  try {
    const pollsCol = db.collection<PollDoc>('polls');
    const existing = await pollsCol.findOne({ id: demoPoll.id });
    if (!existing) {
      await pollsCol.insertOne({ ...demoPoll });
      logMongoOp('INSERT_ONE', 'polls', `Seeded initial demo poll ${demoPoll.code}`);
    }

    const usersCol = db.collection<UserDoc>('users');
    for (const u of demoUsers) {
      const uExist = await usersCol.findOne({ email: u.email });
      if (!uExist) {
        await usersCol.insertOne({ ...u, created_at: new Date().toISOString() });
        logMongoOp('INSERT_ONE', 'users', `Seeded user ${u.email}`);
      }
    }
  } catch (err: any) {
    console.warn('[MongoDB Seed Notice]', err.message);
  }
}

export async function mongoFindPoll(idOrCode: string): Promise<PollDoc | null> {
  if (!isConnected || !db) return null;
  const tStart = Date.now();
  try {
    const pollsCol = db.collection<PollDoc>('polls');
    const poll = await pollsCol.findOne({
      $or: [
        { id: idOrCode },
        { code: idOrCode.toUpperCase() }
      ]
    });
    logMongoOp('FIND_ONE', 'polls', `Query for '${idOrCode}'`, Date.now() - tStart);
    return poll;
  } catch (err: any) {
    logMongoOp('FIND_ONE_ERROR', 'polls', err.message);
    return null;
  }
}

export async function mongoListPolls(): Promise<PollDoc[]> {
  if (!isConnected || !db) return [];
  const tStart = Date.now();
  try {
    const pollsCol = db.collection<PollDoc>('polls');
    const polls = await pollsCol.find({}).sort({ created_at: -1 }).toArray();
    logMongoOp('FIND_MANY', 'polls', `Retrieved ${polls.length} polls`, Date.now() - tStart);
    return polls;
  } catch (err: any) {
    logMongoOp('FIND_MANY_ERROR', 'polls', err.message);
    return [];
  }
}

export async function mongoCreatePoll(newPoll: PollDoc): Promise<boolean> {
  if (!isConnected || !db) return false;
  const tStart = Date.now();
  try {
    const pollsCol = db.collection<PollDoc>('polls');
    await pollsCol.insertOne({ ...newPoll });
    logMongoOp('INSERT_ONE', 'polls', `Created poll ${newPoll.id} (${newPoll.code})`, Date.now() - tStart);
    return true;
  } catch (err: any) {
    logMongoOp('INSERT_ONE_ERROR', 'polls', err.message);
    return false;
  }
}

export async function mongoRecordVote(
  pollId: string,
  voterId: string,
  optionId: string
): Promise<{ success: boolean; alreadyVoted: boolean; updatedPoll?: PollDoc }> {
  if (!isConnected || !db) return { success: false, alreadyVoted: false };
  const tStart = Date.now();
  try {
    const votesCol = db.collection<VoteDoc>('votes');
    const pollsCol = db.collection<PollDoc>('polls');

    // 1. Insert vote document (enforces compound unique index { poll_id: 1, voter_id: 1 })
    try {
      await votesCol.insertOne({
        poll_id: pollId,
        voter_id: voterId,
        option_id: optionId,
        timestamp: new Date().toISOString(),
      });
      logMongoOp('INSERT_ONE', 'votes', `Recorded ballot voter=${voterId} option=${optionId}`);
    } catch (insertErr: any) {
      // Code 11000 indicates duplicate key violation in MongoDB
      if (insertErr.code === 11000 || insertErr.message?.includes('duplicate key')) {
        logMongoOp('DUPLICATE_KEY', 'votes', `Voter ${voterId} already voted in poll ${pollId}`);
        return { success: false, alreadyVoted: true };
      }
      throw insertErr;
    }

    // 2. Increment option votes and total_votes atomically in poll document
    await pollsCol.updateOne(
      { id: pollId, 'options.id': optionId },
      {
        $inc: {
          'options.$.votes': 1,
          total_votes: 1,
        }
      }
    );

    // 3. Fetch updated document and calculate percentages
    const updated = await pollsCol.findOne({ id: pollId });
    if (updated && updated.total_votes > 0) {
      updated.options.forEach((opt) => {
        opt.percentage = (opt.votes / updated.total_votes) * 100;
      });
      await pollsCol.updateOne(
        { id: pollId },
        { $set: { options: updated.options } }
      );
    }

    logMongoOp('UPDATE_ONE', 'polls', `Atomic increment option=${optionId} in poll=${pollId}`, Date.now() - tStart);
    return { success: true, alreadyVoted: false, updatedPoll: updated || undefined };
  } catch (err: any) {
    logMongoOp('VOTE_ERROR', 'votes', err.message);
    return { success: false, alreadyVoted: false };
  }
}

export async function mongoHasVoted(pollId: string, voterId: string): Promise<boolean> {
  if (!isConnected || !db) return false;
  try {
    const votesCol = db.collection<VoteDoc>('votes');
    const count = await votesCol.countDocuments({ poll_id: pollId, voter_id: voterId });
    return count > 0;
  } catch {
    return false;
  }
}

export async function mongoRecordReaction(pollId: string, emoji: string): Promise<Record<string, number> | null> {
  if (!isConnected || !db) return null;
  try {
    const pollsCol = db.collection<PollDoc>('polls');
    const updateField = `reactions.${emoji}`;
    await pollsCol.updateOne(
      { id: pollId },
      { $inc: { [updateField]: 1 } }
    );
    const updated = await pollsCol.findOne({ id: pollId });
    logMongoOp('UPDATE_ONE', 'polls', `Inc reaction ${emoji} in ${pollId}`);
    return updated?.reactions || null;
  } catch (err: any) {
    logMongoOp('REACTION_ERROR', 'polls', err.message);
    return null;
  }
}

export async function mongoAddActivity(pollId: string, activity: ActivityDoc) {
  if (!isConnected || !db) return;
  try {
    const actCol = db.collection<ActivityDoc>('activities');
    await actCol.insertOne({ ...activity, poll_id: pollId });
    logMongoOp('INSERT_ONE', 'activities', `Activity: ${activity.text}`);
  } catch (err: any) {
    console.warn('[MongoDB Activity Error]', err.message);
  }
}

export async function mongoGetActivities(pollId: string, limit = 40): Promise<ActivityDoc[]> {
  if (!isConnected || !db) return [];
  try {
    const actCol = db.collection<ActivityDoc>('activities');
    return await actCol.find({ poll_id: pollId }).sort({ time: -1 }).limit(limit).toArray();
  } catch {
    return [];
  }
}

export async function mongoFindUserByEmail(email: string): Promise<UserDoc | null> {
  if (!isConnected || !db) return null;
  const tStart = Date.now();
  try {
    const usersCol = db.collection<UserDoc>('users');
    const user = await usersCol.findOne({ email: email.trim().toLowerCase() });
    logMongoOp('FIND_ONE', 'users', `Lookup email ${email}`, Date.now() - tStart);
    return user;
  } catch (err: any) {
    logMongoOp('FIND_USER_ERROR', 'users', err.message);
    return null;
  }
}

export async function mongoCreateUser(user: UserDoc): Promise<boolean> {
  if (!isConnected || !db) return false;
  const tStart = Date.now();
  try {
    const usersCol = db.collection<UserDoc>('users');
    await usersCol.insertOne({
      ...user,
      email: user.email.trim().toLowerCase(),
      created_at: new Date().toISOString(),
    });
    logMongoOp('INSERT_ONE', 'users', `Created user ${user.email}`, Date.now() - tStart);
    return true;
  } catch (err: any) {
    logMongoOp('CREATE_USER_ERROR', 'users', err.message);
    return false;
  }
}

export async function mongoUpdatePollStatus(pollId: string, isClosed: boolean): Promise<boolean> {
  if (!isConnected || !db) return false;
  try {
    const pollsCol = db.collection<PollDoc>('polls');
    await pollsCol.updateOne({ id: pollId }, { $set: { is_closed: isClosed } });
    logMongoOp('UPDATE_ONE', 'polls', `Status is_closed=${isClosed} on ${pollId}`);
    return true;
  } catch {
    return false;
  }
}

export async function mongoResetPoll(pollId: string): Promise<boolean> {
  if (!isConnected || !db) return false;
  try {
    const pollsCol = db.collection<PollDoc>('polls');
    const votesCol = db.collection<VoteDoc>('votes');
    const actCol = db.collection<ActivityDoc>('activities');

    await votesCol.deleteMany({ poll_id: pollId });
    await actCol.deleteMany({ poll_id: pollId });

    const poll = await pollsCol.findOne({ id: pollId });
    if (poll) {
      poll.options.forEach((opt) => {
        opt.votes = 0;
        opt.percentage = 0;
      });
      await pollsCol.updateOne(
        { id: pollId },
        {
          $set: {
            total_votes: 0,
            options: poll.options,
            reactions: {},
          }
        }
      );
    }
    logMongoOp('DELETE_MANY + UPDATE', 'votes/polls', `Reset all votes for poll ${pollId}`);
    return true;
  } catch {
    return false;
  }
}

import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { RedisOperationLog } from './types';

let redisClient: any = null;
let redisSubClient: any = null;
let redisOnline = true;
let redisEngine: 'external' | 'in-memory' = 'in-memory';

const recentRedisOps: RedisOperationLog[] = [];

type MessageHandler = (channel: string, message: string) => void;
const messageHandlers: Set<MessageHandler> = new Set();

export function logRedisOp(op: string, key: string, args?: string) {
  recentRedisOps.unshift({
    op,
    key,
    args,
    time: new Date().toISOString(),
  });
  if (recentRedisOps.length > 30) recentRedisOps.pop();
}

export function onRedisMessage(handler: MessageHandler): () => void {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

export function initRedisEngine() {
  const customHost = process.env.REDIS_HOST;
  const customUrl = process.env.REDIS_URL;

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
        redisClient = liveClient;
        redisSubClient = liveSub;
        redisOnline = true;
        redisEngine = 'external';
        console.log(`[Redis Engine] Connected to external Redis cluster (${customHost || 'custom URL'})`);
        bindRedisSub();
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
    activateMemoryRedis();
  }
}

function activateMemoryRedis() {
  try {
    const mock = new RedisMock();
    const mockSub = mock.duplicate();
    redisClient = mock;
    redisSubClient = mockSub;
    redisOnline = true;
    redisEngine = 'in-memory';
    console.log('[Redis Engine] In-memory Redis engine initialized (Pub/Sub & Atomic Counters ready)');
    bindRedisSub();
  } catch (err: any) {
    console.warn('[Redis Engine Warning]', err.message);
  }
}

function bindRedisSub() {
  if (!redisSubClient) return;
  try {
    redisSubClient.psubscribe('channel:poll:*', (err: any) => {
      if (!err) console.log('[Redis Engine] Subscribed to pattern channel:poll:*');
    });

    redisSubClient.on('pmessage', (_pattern: string, channel: string, message: string) => {
      for (const handler of messageHandlers) {
        try {
          handler(channel, message);
        } catch (e) {
          console.warn('[Redis Message Dispatch Warning]', e);
        }
      }
    });
  } catch (err: any) {
    console.warn('[Redis Subscribe Warning]', err.message);
  }
}

export function getRedis() {
  return redisClient;
}

export function getRedisStatus() {
  return {
    online: redisOnline,
    engine: redisEngine,
    recentOps: recentRedisOps,
  };
}

export async function publishPollEvent(pollId: string, eventPayload: any) {
  if (!redisClient) return;
  try {
    const json = JSON.stringify(eventPayload);
    await redisClient.publish(`channel:poll:${pollId}`, json);
    logRedisOp('PUBLISH', `channel:poll:${pollId}`, `${eventPayload.type} broadcast`);
  } catch (err: any) {
    console.warn('[Redis Publish Warning]', err.message);
  }
}

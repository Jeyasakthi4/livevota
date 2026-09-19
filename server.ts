import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

import { initRedisEngine, getRedis, logRedisOp } from './server/redis';
import { setupWebSocketHub, handleUpgrade } from './server/websocket';
import { apiRouter, memoryPolls, memoryUsers } from './server/routes';
import {
  initMongoDB,
  startMongoAutoReconnect,
  mongoSeedDefaults,
  mongoListPolls,
  mongoFindUserByEmail,
  mongoCreateUser,
  isMongoOnline,
} from './server/db';
import { generateJWT } from './server/auth';
import { Poll, User } from './server/types';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// 1. Initialize Redis Hot-Path Cache & Pub/Sub Engine
initRedisEngine();

// 2. Initial Demo Dataset Seed
const demoPollId = 'poll_techstack_demo';
const initialDemoPoll: Poll = {
  id: demoPollId,
  code: 'GO2026',
  title: 'What is your preferred backend runtime for real-time systems?',
  description: 'LiveVota benchmark poll evaluating high-concurrency event-driven architectures with Go, Gin, Redis, and MongoDB.',
  creator_id: 'usr_internship_demo',
  creator_name: 'LiveVota Staff',
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

const demoUser: User = {
  id: 'usr_internship_demo',
  username: 'Alex Chen',
  email: 'alex.chen@livevota.io',
  password_hash: crypto.createHash('sha256').update('salt_pulsepoll_2026_password123').digest('hex'),
};
memoryUsers.set(demoUser.email, demoUser);
memoryUsers.set('alex.chen@pulsepoll.io', { ...demoUser, email: 'alex.chen@pulsepoll.io' });

const demoVoter: User = {
  id: 'usr_voter_demo',
  username: 'Jordan Lee',
  email: 'jordan.lee@livevota.io',
  password_hash: crypto.createHash('sha256').update('salt_pulsepoll_2026_password123').digest('hex'),
};
memoryUsers.set(demoVoter.email, demoVoter);
memoryUsers.set('jordan.lee@pulsepoll.io', { ...demoVoter, email: 'jordan.lee@pulsepoll.io' });

// Seed initial tallies into Redis
setTimeout(async () => {
  const redis = getRedis();
  if (redis) {
    try {
      const votesKey = `poll:${demoPollId}:votes`;
      for (const opt of initialDemoPoll.options) {
        await redis.hset(votesKey, opt.id, opt.votes);
      }
      await redis.set(`poll:${demoPollId}:total_votes`, initialDemoPoll.total_votes);
      await redis.set(`code:${initialDemoPoll.code}`, demoPollId);
      logRedisOp('HSET / SET', votesKey, 'Seeded demo poll tallies');
    } catch {}
  }
}, 1000);

// 3. Initialize MongoDB Connection & Resilient Auto-Reconnect
initMongoDB()
  .then(async (online) => {
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
  })
  .catch((err) => {
    console.warn('[MongoDB Initialization Warning]', err);
  });

// 4. Setup WebSocket Hub with Immediate State Snapshot & Redis PubSub Bindings
setupWebSocketHub((pollId: string) => memoryPolls.get(pollId));

// Upgrade HTTP to WebSockets
server.on('upgrade', handleUpgrade);

// 5. Mount Modular API Routes
app.use('/api', apiRouter);

// 6. Google OAuth Redirect Callback Endpoint
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
            <p style="color:#6b7280;font-size:11px;">You can close this window or use the instant Google Account option in LiveVota.</p>
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
      }
    }
  } catch (e) {
    console.warn('[Google OAuth Token Exchange Warning]', e);
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

  const token = generateJWT(existingUser);
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
          <p style="color:#9ca3af;font-size:13px;">Returning to LiveVota...</p>
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

// 7. Vite Development Middleware & Production Static Serving
async function startServer() {
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
    console.log(`[LiveVota Server] Running cleanly on http://0.0.0.0:${PORT}`);
  });
}

startServer();

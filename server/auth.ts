import crypto from 'crypto';
import { Request } from 'express';
import { AuthTokenPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'livevota-jwt-secret-2026';

export function generateJWT(user: { id: string; username: string; email: string }): string {
  const payload = Buffer.from(
    JSON.stringify({
      user_id: user.id,
      username: user.username,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
    })
  ).toString('base64url');

  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `header.${payload}.${signature}`;
}

export function verifyAuthHeader(req: Request): AuthTokenPayload | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payloadStr = Buffer.from(parts[1], 'base64url').toString();
      const decoded = JSON.parse(payloadStr);
      if (decoded.exp && decoded.exp > Math.floor(Date.now() / 1000)) {
        return {
          userId: decoded.user_id,
          username: decoded.username,
          email: decoded.email,
        };
      }
    }
  } catch {}
  return null;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`salt_pulsepoll_2026_${password}`).digest('hex');
}

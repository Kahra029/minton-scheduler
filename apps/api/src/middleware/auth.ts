import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import type { AppEnv, AuthPayload } from '../bindings';

export const COOKIE_NAME = 'session';

async function authenticate(c: Context<AppEnv>): Promise<AuthPayload | null> {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;
  try {
    return (await verify(token, c.env.JWT_SECRET, 'HS256')) as AuthPayload;
  } catch {
    return null;
  }
}

/** ログイン必須。無効なら 401 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const payload = await authenticate(c);
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);
  c.set('member', payload);
  await next();
});

/** admin ロール必須。未ログインは 401、権限不足は 403 */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const payload = await authenticate(c);
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);
  if (payload.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  c.set('member', payload);
  await next();
});

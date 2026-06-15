import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../bindings';

/**
 * admin 操作の簡易保護 (v1)。
 * X-Admin-Token ヘッダーが ADMIN_TOKEN と一致する場合のみ通過させる。
 * v2 で JWT 認証に置き換える予定 (spec 2.2.1)。
 */
export const adminAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header('X-Admin-Token');
  if (!c.env.ADMIN_TOKEN || token !== c.env.ADMIN_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

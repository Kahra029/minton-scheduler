import { Hono } from 'hono';
import type { AppEnv } from '../bindings';
import { requireAuth } from '../middleware/auth';
import { upsertAttendanceSchema } from '../lib/validation';
import { upsertAttendance } from '../db/attendance';

const attendance = new Hono<AppEnv>();

// PUT /api/attendance — 出欠更新 (upsert)。ログイン必須。
// 本人の出欠のみ更新可 (admin は全員分を更新可)。
attendance.put('/', requireAuth, async (c) => {
  const parsed = upsertAttendanceSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }
  const me = c.get('member');
  if (me.role !== 'admin' && me.sub !== parsed.data.member_id) {
    return c.json({ error: '他のメンバーの出欠は変更できません' }, 403);
  }
  return c.json(await upsertAttendance(c.env.DB, parsed.data));
});

export default attendance;

import { Hono } from 'hono';
import type { AppEnv } from '../bindings';
import { upsertAttendanceSchema } from '../lib/validation';
import { upsertAttendance } from '../db/attendance';

const attendance = new Hono<AppEnv>();

// PUT /api/attendance — 出欠更新 (upsert)。全ロール
attendance.put('/', async (c) => {
  const parsed = upsertAttendanceSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }
  return c.json(await upsertAttendance(c.env.DB, parsed.data));
});

export default attendance;

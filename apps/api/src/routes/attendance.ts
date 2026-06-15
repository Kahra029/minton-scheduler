import { Hono } from 'hono';
import type { AppEnv } from '../bindings';
import { requireAuth } from '../middleware/auth';
import { upsertAttendanceSchema } from '../lib/validation';
import { Errors, parseJson } from '../lib/errors';
import { upsertAttendance } from '../db/attendance';
import { getEvent } from '../db/events';

const attendance = new Hono<AppEnv>();

// PUT /api/attendance — 出欠更新 (upsert)。ログイン必須。
// 本人の出欠のみ更新可 (admin は全員分を更新可)。
attendance.put('/', requireAuth, async (c) => {
  const input = await parseJson(c, upsertAttendanceSchema);
  const me = c.get('member');
  if (me.role !== 'admin' && me.sub !== input.member_id) {
    throw Errors.forbidden('他のメンバーの出欠は変更できません');
  }
  // 締切/終了のイベントは一般メンバーの変更不可 (admin は調整のため可)
  if (me.role !== 'admin') {
    const event = await getEvent(c.env.DB, input.event_id);
    if (event && (event.status === 'full' || event.status === 'closed')) {
      throw Errors.forbidden('このイベントの募集は締め切られています');
    }
  }
  return c.json(await upsertAttendance(c.env.DB, input));
});

export default attendance;

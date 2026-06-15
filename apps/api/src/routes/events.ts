import { Hono } from 'hono';
import type { AppEnv, AuthPayload } from '../bindings';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth';
import { createEventSchema, updateEventSchema } from '../lib/validation';
import { Errors, parseJson } from '../lib/errors';
import {
  listEvents,
  getEventDetail,
  createEvents,
  updateEvent,
  deleteEvent,
} from '../db/events';
import { listAttendanceByEvent } from '../db/attendance';

const events = new Hono<AppEnv>();

// GET /api/events — 一覧 + 集計バッジ (未ログインでも閲覧可。集計は人数のみ)
events.get('/', optionalAuth, async (c) => {
  return c.json(await listEvents(c.env.DB));
});

// GET /api/events/:id — 詳細。未ログインは個人名 (出欠明細) を返さず集計のみ
events.get('/:id', optionalAuth, async (c) => {
  const detail = await getEventDetail(c.env.DB, c.req.param('id'));
  if (!detail) throw Errors.notFound('イベントが見つかりません');
  const member = c.get('member') as AuthPayload | undefined;
  if (!member) return c.json({ ...detail, attendance: [] });
  return c.json(detail);
});

// GET /api/events/:id/attendance — イベント別出欠一覧
events.get('/:id/attendance', requireAuth, async (c) => {
  return c.json(await listAttendanceByEvent(c.env.DB, c.req.param('id')));
});

// POST /api/events — admin
events.post('/', requireAdmin, async (c) => {
  const input = await parseJson(c, createEventSchema);
  return c.json(await createEvents(c.env.DB, input), 201);
});

// PUT /api/events/:id — admin
events.put('/:id', requireAdmin, async (c) => {
  const input = await parseJson(c, updateEventSchema);
  const updated = await updateEvent(c.env.DB, c.req.param('id'), input);
  if (!updated) throw Errors.notFound('イベントが見つかりません');
  return c.json(updated);
});

// DELETE /api/events/:id — admin
events.delete('/:id', requireAdmin, async (c) => {
  const ok = await deleteEvent(c.env.DB, c.req.param('id'));
  if (!ok) throw Errors.notFound('イベントが見つかりません');
  return c.body(null, 204);
});

export default events;

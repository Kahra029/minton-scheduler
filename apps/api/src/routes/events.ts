import { Hono } from 'hono';
import type { AppEnv } from '../bindings';
import { adminAuth } from '../middleware/admin';
import { createEventSchema, updateEventSchema } from '../lib/validation';
import {
  listEvents,
  getEventDetail,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../db/events';
import { listAttendanceByEvent } from '../db/attendance';

const events = new Hono<AppEnv>();

// GET /api/events — 一覧 + 集計バッジ
events.get('/', async (c) => {
  return c.json(await listEvents(c.env.DB));
});

// GET /api/events/:id — 詳細 + 出欠一覧
events.get('/:id', async (c) => {
  const detail = await getEventDetail(c.env.DB, c.req.param('id'));
  if (!detail) return c.json({ error: 'Event not found' }, 404);
  return c.json(detail);
});

// GET /api/events/:id/attendance — イベント別出欠一覧
events.get('/:id/attendance', async (c) => {
  return c.json(await listAttendanceByEvent(c.env.DB, c.req.param('id')));
});

// POST /api/events — admin
events.post('/', adminAuth, async (c) => {
  const parsed = createEventSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }
  return c.json(await createEvent(c.env.DB, parsed.data), 201);
});

// PUT /api/events/:id — admin
events.put('/:id', adminAuth, async (c) => {
  const parsed = updateEventSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }
  const updated = await updateEvent(c.env.DB, c.req.param('id'), parsed.data);
  if (!updated) return c.json({ error: 'Event not found' }, 404);
  return c.json(updated);
});

// DELETE /api/events/:id — admin
events.delete('/:id', adminAuth, async (c) => {
  const ok = await deleteEvent(c.env.DB, c.req.param('id'));
  if (!ok) return c.json({ error: 'Event not found' }, 404);
  return c.body(null, 204);
});

export default events;

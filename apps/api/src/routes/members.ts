import { Hono } from 'hono';
import type { AppEnv } from '../bindings';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { createMemberSchema, updateMemberSchema } from '../lib/validation';
import {
  listMembers,
  createMember,
  updateMember,
  deleteMember,
} from '../db/members';

const members = new Hono<AppEnv>();

// GET /api/members — 全員
members.get('/', requireAuth, async (c) => {
  return c.json(await listMembers(c.env.DB));
});

// POST /api/members — admin
members.post('/', requireAdmin, async (c) => {
  const parsed = createMemberSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }
  return c.json(await createMember(c.env.DB, parsed.data), 201);
});

// PUT /api/members/:id — admin
members.put('/:id', requireAdmin, async (c) => {
  const parsed = updateMemberSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }
  const updated = await updateMember(c.env.DB, c.req.param('id'), parsed.data);
  if (!updated) return c.json({ error: 'Member not found' }, 404);
  return c.json(updated);
});

// DELETE /api/members/:id — admin
members.delete('/:id', requireAdmin, async (c) => {
  const ok = await deleteMember(c.env.DB, c.req.param('id'));
  if (!ok) return c.json({ error: 'Member not found' }, 404);
  return c.body(null, 204);
});

export default members;

import { Hono } from 'hono';
import type { AppEnv } from '../bindings';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { createMemberSchema, updateMemberSchema } from '../lib/validation';
import { Errors, parseJson } from '../lib/errors';
import {
  listMembers,
  createMember,
  updateMember,
  deleteMember,
} from '../db/members';

const members = new Hono<AppEnv>();

// GET /api/members — ログイン必須
members.get('/', requireAuth, async (c) => {
  return c.json(await listMembers(c.env.DB));
});

// POST /api/members — admin
members.post('/', requireAdmin, async (c) => {
  const input = await parseJson(c, createMemberSchema);
  return c.json(await createMember(c.env.DB, input), 201);
});

// PUT /api/members/:id — admin
members.put('/:id', requireAdmin, async (c) => {
  const input = await parseJson(c, updateMemberSchema);
  const updated = await updateMember(c.env.DB, c.req.param('id'), input);
  if (!updated) throw Errors.notFound('メンバーが見つかりません');
  return c.json(updated);
});

// DELETE /api/members/:id — admin
members.delete('/:id', requireAdmin, async (c) => {
  const ok = await deleteMember(c.env.DB, c.req.param('id'));
  if (!ok) throw Errors.notFound('メンバーが見つかりません');
  return c.body(null, 204);
});

export default members;

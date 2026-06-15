import { Hono } from 'hono';
import type { AppEnv } from '../bindings';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { createTemplateSchema, updateTemplateSchema } from '../lib/validation';
import { Errors, parseJson } from '../lib/errors';
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../db/templates';

const templates = new Hono<AppEnv>();

// GET /api/templates — ログイン必須 (作成フォームで使う)
templates.get('/', requireAuth, async (c) => {
  return c.json(await listTemplates(c.env.DB));
});

// POST /api/templates — admin
templates.post('/', requireAdmin, async (c) => {
  const input = await parseJson(c, createTemplateSchema);
  return c.json(await createTemplate(c.env.DB, input), 201);
});

// PUT /api/templates/:id — admin
templates.put('/:id', requireAdmin, async (c) => {
  const input = await parseJson(c, updateTemplateSchema);
  const updated = await updateTemplate(c.env.DB, c.req.param('id'), input);
  if (!updated) throw Errors.notFound('テンプレートが見つかりません');
  return c.json(updated);
});

// DELETE /api/templates/:id — admin
templates.delete('/:id', requireAdmin, async (c) => {
  const ok = await deleteTemplate(c.env.DB, c.req.param('id'));
  if (!ok) throw Errors.notFound('テンプレートが見つかりません');
  return c.body(null, 204);
});

export default templates;

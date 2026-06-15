import { Hono } from 'hono';
import type { AppEnv } from '../bindings';
import { requireAdmin } from '../middleware/auth';
import { updateFeeSettingsSchema } from '../lib/validation';
import { parseJson } from '../lib/errors';
import { getSettings, updateSettings } from '../db/settings';

const settings = new Hono<AppEnv>();

// GET /api/settings — 料金設定 (admin のみ。集金は admin 機能)
settings.get('/', requireAdmin, async (c) => {
  return c.json(await getSettings(c.env.DB));
});

// PUT /api/settings — 料金設定の更新 (admin)
settings.put('/', requireAdmin, async (c) => {
  const input = await parseJson(c, updateFeeSettingsSchema);
  return c.json(await updateSettings(c.env.DB, input));
});

export default settings;

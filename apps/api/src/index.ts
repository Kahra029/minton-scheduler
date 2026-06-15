import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from './bindings';
import auth from './routes/auth';
import events from './routes/events';
import members from './routes/members';
import attendance from './routes/attendance';
import templates from './routes/templates';
import settings from './routes/settings';

const app = new Hono<AppEnv>();

// フロントエンド (apps/web) からの呼び出しを許可
app.use('/api/*', cors());

// エラーを統一フォーマット { error, details } に整形する
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    const cause = err.cause as { details?: unknown } | undefined;
    return c.json({ error: err.message, details: cause?.details }, err.status);
  }
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// ヘルスチェック
app.get('/', (c) => c.text('BadSync API'));

// API ルート (spec 4.3)
app.route('/api/auth', auth);
app.route('/api/events', events);
app.route('/api/members', members);
app.route('/api/attendance', attendance);
app.route('/api/templates', templates);
app.route('/api/settings', settings);

export default app;

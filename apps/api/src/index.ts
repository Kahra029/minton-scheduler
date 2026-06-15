import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './bindings';
import events from './routes/events';
import members from './routes/members';
import attendance from './routes/attendance';

const app = new Hono<AppEnv>();

// フロントエンド (apps/web) からの呼び出しを許可
app.use('/api/*', cors());

// ヘルスチェック
app.get('/', (c) => c.text('BadSync API'));

// API ルート (spec 4.3)
app.route('/api/events', events);
app.route('/api/members', members);
app.route('/api/attendance', attendance);

export default app;

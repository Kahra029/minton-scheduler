import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { setCookie, deleteCookie } from 'hono/cookie';
import type { AppEnv } from '../bindings';
import { requireAuth, COOKIE_NAME } from '../middleware/auth';
import { requestOtpSchema, verifyOtpSchema } from '../lib/validation';
import { getMember, getMemberByEmail } from '../db/members';
import { issueOtp, verifyOtp } from '../lib/otp';
import { sendOtpEmail } from '../lib/mail';

const auth = new Hono<AppEnv>();

const SESSION_TTL = 60 * 60 * 24 * 30; // 30日 (秒)

// POST /api/auth/request — メールに OTP 送信 (ユーザー列挙防止のため常に 200)
auth.post('/request', async (c) => {
  const parsed = requestOtpSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }
  const member = await getMemberByEmail(c.env.DB, parsed.data.email);
  if (member) {
    const code = await issueOtp(c.env, parsed.data.email, member.id);
    if (code) await sendOtpEmail(c.env, parsed.data.email, code);
  }
  return c.json({ ok: true });
});

// POST /api/auth/verify — OTP 検証 → JWT Cookie 発行
auth.post('/verify', async (c) => {
  const parsed = verifyOtpSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }
  const memberId = await verifyOtp(c.env, parsed.data.email, parsed.data.code);
  if (!memberId) {
    return c.json({ error: 'コードが正しくないか期限切れです' }, 401);
  }
  const member = await getMember(c.env.DB, memberId);
  if (!member) return c.json({ error: 'メンバーが見つかりません' }, 404);

  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
  const token = await sign(
    { sub: member.id, role: member.role, name: member.name, exp },
    c.env.JWT_SECRET,
  );
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    // dev (http) では Secure 属性を付けない (付けると保存されない)
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
  return c.json(member);
});

// POST /api/auth/logout — Cookie 削除
auth.post('/logout', requireAuth, (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' });
  return c.body(null, 204);
});

// GET /api/auth/me — 現在のログイン member
auth.get('/me', requireAuth, async (c) => {
  const payload = c.get('member');
  const member = await getMember(c.env.DB, payload.sub);
  if (!member) return c.json({ error: 'Not found' }, 404);
  return c.json(member);
});

export default auth;

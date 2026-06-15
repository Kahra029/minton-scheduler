import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { setCookie, deleteCookie } from 'hono/cookie';
import type { AppEnv } from '../bindings';
import { requireAuth, COOKIE_NAME } from '../middleware/auth';
import { requestOtpSchema, verifyOtpSchema } from '../lib/validation';
import { Errors, parseJson } from '../lib/errors';
import { getMember, getMemberByEmail } from '../db/members';
import { issueOtp, verifyOtp } from '../lib/otp';
import { sendOtpEmail } from '../lib/mail';

const auth = new Hono<AppEnv>();

const SESSION_TTL = 60 * 60 * 24 * 30; // 30日 (秒)

// POST /api/auth/request — メールに OTP 送信 (ユーザー列挙防止のため常に 200)
auth.post('/request', async (c) => {
  const { email } = await parseJson(c, requestOtpSchema);
  const member = await getMemberByEmail(c.env.DB, email);
  if (member) {
    const code = await issueOtp(c.env, email, member.id);
    if (code) await sendOtpEmail(c.env, email, code);
  }
  return c.json({ ok: true });
});

// POST /api/auth/verify — OTP 検証 → JWT Cookie 発行
auth.post('/verify', async (c) => {
  const { email, code } = await parseJson(c, verifyOtpSchema);
  const memberId = await verifyOtp(c.env, email, code);
  if (!memberId) throw Errors.unauthorized('コードが正しくないか期限切れです');

  const member = await getMember(c.env.DB, memberId);
  if (!member) throw Errors.notFound('メンバーが見つかりません');

  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
  const token = await sign(
    { sub: member.id, role: member.role, name: member.name, exp },
    c.env.JWT_SECRET,
  );
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
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
  if (!member) throw Errors.notFound();
  return c.json(member);
});

export default auth;

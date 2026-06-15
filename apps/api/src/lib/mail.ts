import type { Bindings } from '../bindings';

// TODO(Phase 6): 送信ドメイン取得後に自ドメインのアドレスへ差し替える
const FROM = '信天翁 <noreply@example.com>';

/**
 * OTP ログインコードをメール送信する。
 * send_email binding (SEB) が無い dev / ドメイン未取得時は実送信せずログ出力する。
 */
export async function sendOtpEmail(
  env: Bindings,
  email: string,
  code: string,
): Promise<void> {
  const subject = '信天翁 ログインコード';
  const body =
    `信天翁 のログインコード: ${code}\n\n` +
    `このコードを10分以内に入力してください。\n` +
    `心当たりがない場合はこのメールを無視してください。`;

  if (!env.SEB) {
    console.log(`[DEV OTP] to=${email} code=${code}`);
    return;
  }

  const { EmailMessage } = await import('cloudflare:email');
  const raw =
    `From: ${FROM}\r\n` +
    `To: ${email}\r\n` +
    `Subject: ${subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/plain; charset=utf-8\r\n` +
    `\r\n` +
    body;
  await env.SEB.send(new EmailMessage(FROM, email, raw));
}

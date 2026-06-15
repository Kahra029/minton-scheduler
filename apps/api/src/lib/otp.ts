import type { Bindings } from '../bindings';

const TTL_SECONDS = 600; // 10分
const COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

interface OtpRecord {
  codeHash: string;
  memberId: string;
  attempts: number;
}

function generateCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, '0');
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const otpKey = (email: string) => `otp:${email.toLowerCase()}`;
const cooldownKey = (email: string) => `cooldown:${email.toLowerCase()}`;

/**
 * OTP を発行して KV に保存する。
 * 直近に送信済み (cooldown 中) の場合は null を返し、再送しない。
 * 成功時は呼び出し側が送信すべきコードを返す。
 */
export async function issueOtp(
  env: Bindings,
  email: string,
  memberId: string,
): Promise<string | null> {
  if (await env.OTP.get(cooldownKey(email))) return null;

  const code = generateCode();
  const record: OtpRecord = {
    codeHash: await sha256(code),
    memberId,
    attempts: 0,
  };
  await env.OTP.put(otpKey(email), JSON.stringify(record), {
    expirationTtl: TTL_SECONDS,
  });
  await env.OTP.put(cooldownKey(email), '1', {
    expirationTtl: COOLDOWN_SECONDS,
  });
  return code;
}

/**
 * OTP を検証する。成功時は member id を返してレコードを削除する。
 * 不一致は試行回数を加算し、上限超過でレコードを破棄する。
 */
export async function verifyOtp(
  env: Bindings,
  email: string,
  code: string,
): Promise<string | null> {
  const key = otpKey(email);
  const raw = await env.OTP.get(key);
  if (!raw) return null;

  const record = JSON.parse(raw) as OtpRecord;
  if (record.attempts >= MAX_ATTEMPTS) {
    await env.OTP.delete(key);
    return null;
  }

  if ((await sha256(code)) !== record.codeHash) {
    record.attempts += 1;
    await env.OTP.put(key, JSON.stringify(record), {
      expirationTtl: TTL_SECONDS,
    });
    return null;
  }

  await env.OTP.delete(key);
  return record.memberId;
}

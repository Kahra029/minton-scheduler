import type { MemberRole } from '@minton/types';

/** Cloudflare Workers のバインディング / 環境変数 */
export type Bindings = {
  /** D1 データベース */
  DB: D1Database;
  /** OTP 保存用 KV (TTL 自動失効) */
  OTP: KVNamespace;
  /** JWT 署名鍵 */
  JWT_SECRET: string;
  /**
   * Cloudflare Email Service の send_email binding。
   * 本番（送信ドメインのオンボード後）のみ設定し、未設定の dev では
   * OTP をログ出力する (lib/mail.ts)。
   */
  SEB?: SendEmail;
};

/** JWT ペイロード (セッション) */
export type AuthPayload = {
  /** member id */
  sub: string;
  role: MemberRole;
  name: string;
  exp: number;
};

/** Hono の型パラメータ。各ルーターで共有する */
export type AppEnv = {
  Bindings: Bindings;
  Variables: { member: AuthPayload };
};

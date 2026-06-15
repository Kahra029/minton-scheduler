/** Cloudflare Workers のバインディング / 環境変数 */
export type Bindings = {
  /** D1 データベース (wrangler.jsonc の d1_databases.binding と一致) */
  DB: D1Database;
  /** admin 操作の簡易保護トークン (X-Admin-Token ヘッダーと比較する) */
  ADMIN_TOKEN: string;
};

/** Hono の型パラメータ。各ルーターで共有する */
export type AppEnv = { Bindings: Bindings };

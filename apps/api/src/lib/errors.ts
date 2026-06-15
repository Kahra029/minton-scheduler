import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { z } from 'zod';

/**
 * アプリ共通のエラー。throw すると index.ts の app.onError が
 * { error, details } の統一フォーマットに整形する。
 */
export const Errors = {
  badRequest: (message = 'リクエストが不正です', details?: unknown) =>
    new HTTPException(400, {
      message,
      cause: details !== undefined ? { details } : undefined,
    }),
  unauthorized: (message = '認証が必要です') =>
    new HTTPException(401, { message }),
  forbidden: (message = '権限がありません') =>
    new HTTPException(403, { message }),
  notFound: (message = '見つかりません') =>
    new HTTPException(404, { message }),
};

/**
 * リクエストボディを zod で検証する。失敗時は 400 を throw。
 * 各ルートの safeParse ボイラープレートを集約する。
 */
export async function parseJson<T>(
  c: Context,
  schema: z.ZodType<T>,
): Promise<T> {
  const body = await c.req.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    throw Errors.badRequest('入力値が不正です', result.error.flatten());
  }
  return result.data;
}

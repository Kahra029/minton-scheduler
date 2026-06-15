/**
 * v1 の暫定 admin 認証。
 * admin トークンを localStorage に保持し、管理操作 (イベント/メンバー CRUD) の
 * X-Admin-Token ヘッダーに付与する。v2 で JWT 認証へ移行予定 (spec 2.2.1)。
 */
const KEY = 'badsync_admin_token'

export function getAdminToken(): string {
  return localStorage.getItem(KEY) ?? ''
}

export function setAdminToken(token: string): void {
  const trimmed = token.trim()
  if (trimmed) localStorage.setItem(KEY, trimmed)
  else localStorage.removeItem(KEY)
  // 他コンポーネントへ変更を通知 (同一タブでは storage イベントが飛ばないため)
  window.dispatchEvent(new Event('admin-token-changed'))
}

export function hasAdminToken(): boolean {
  return getAdminToken().length > 0
}

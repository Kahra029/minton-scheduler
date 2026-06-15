import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

/** ログイン & admin ロールを要求する。未ログイン/権限不足は案内を表示 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="text-muted-foreground">読み込み中…</p>
  }
  if (!user) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          この操作にはログインが必要です。
        </p>
        <Button asChild>
          <Link to="/login">ログイン</Link>
        </Button>
      </div>
    )
  }
  if (user.role !== 'admin') {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        この操作には管理者権限が必要です。
      </p>
    )
  }
  return <>{children}</>
}

import type { ReactNode } from 'react'
import { useAdminToken } from '@/hooks/useAdminToken'
import { AdminTokenField } from '@/components/AdminTokenField'

/** 管理者トークンが設定されている場合のみ children を表示し、無ければ入力を促す */
export function AdminGate({ children }: { children: ReactNode }) {
  const token = useAdminToken()
  if (!token) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          この操作には管理者トークンが必要です。
        </p>
        <AdminTokenField />
      </div>
    )
  }
  return <>{children}</>
}

import { useState } from 'react'
import { getAdminToken, setAdminToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** 管理者トークンの設定 UI (v1 暫定)。ヘッダーから開いて入力する */
export function AdminTokenField({ onSaved }: { onSaved?: () => void }) {
  const [value, setValue] = useState(getAdminToken())

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Label htmlFor="admin-token">管理者トークン</Label>
        <Input
          id="admin-token"
          type="password"
          autoComplete="off"
          placeholder="X-Admin-Token"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button
        type="button"
        onClick={() => {
          setAdminToken(value)
          onSaved?.()
        }}
      >
        保存
      </Button>
    </div>
  )
}

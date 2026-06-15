import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Member } from '@minton/types'
import { api, ApiError } from '@/lib/api'
import { AdminGate } from '@/components/AdminGate'
import { RoleBadge } from '@/components/RoleBadge'
import { Button } from '@/components/ui/button'

function MembersList() {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  function reload() {
    api
      .listMembers()
      .then(setMembers)
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : '読み込みに失敗しました')
      )
  }

  useEffect(reload, [])

  async function handleDelete(member: Member) {
    if (!confirm(`「${member.name}」を削除しますか？`)) return
    try {
      await api.deleteMember(member.id)
      reload()
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : '削除に失敗しました')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link to="/members/new">
            <Plus /> メンバー追加
          </Link>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {members?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          メンバーがまだいません
        </p>
      )}

      {members?.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          <span className="flex-1 truncate font-medium">{member.name}</span>
          <RoleBadge role={member.role} />
          <Button asChild size="icon" variant="ghost">
            <Link to={`/members/${member.id}/edit`} aria-label="編集">
              <Pencil />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="削除"
            onClick={() => handleDelete(member)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
    </div>
  )
}

export function MembersPage() {
  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/">
          <ChevronLeft /> イベント一覧
        </Link>
      </Button>
      <h2 className="text-xl font-semibold">メンバー管理</h2>
      <AdminGate>
        <MembersList />
      </AdminGate>
    </div>
  )
}

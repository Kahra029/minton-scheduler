import { Link } from 'react-router-dom'
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Member } from '@minton/types'
import { api, ApiError } from '@/lib/api'
import { RequireAdmin } from '@/components/RequireAdmin'
import { RoleBadge } from '@/components/RoleBadge'
import { Button } from '@/components/ui/button'

function MembersList() {
  const qc = useQueryClient()
  const { data: members, isPending, error } = useQuery({
    queryKey: ['members'],
    queryFn: api.listMembers,
  })
  const del = useMutation({
    mutationFn: (id: string) => api.deleteMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link to="/members/new">
            <Plus /> メンバー追加
          </Link>
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof ApiError ? error.message : '読み込みに失敗しました'}
        </p>
      )}
      {del.isError && (
        <p className="text-sm text-destructive">削除に失敗しました</p>
      )}
      {isPending && (
        <p className="py-8 text-center text-muted-foreground">読み込み中…</p>
      )}
      {members?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          メンバーがまだいません
        </p>
      )}

      {members?.map((member: Member) => (
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
            onClick={() => {
              if (confirm(`「${member.name}」を削除しますか？`))
                del.mutate(member.id)
            }}
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
      <RequireAdmin>
        <MembersList />
      </RequireAdmin>
    </div>
  )
}

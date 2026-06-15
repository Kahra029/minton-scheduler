import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { MemberForm } from '@/components/MemberForm'
import { RequireAdmin } from '@/components/RequireAdmin'
import { Button } from '@/components/ui/button'

function EditMemberBody({ id }: { id: string }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  // 単体取得 API は無いため一覧から該当メンバーを引く
  const { data: members, isPending } = useQuery({
    queryKey: ['members'],
    queryFn: api.listMembers,
  })
  const member = members?.find((m) => m.id === id)

  const update = useMutation({
    mutationFn: (input: Parameters<typeof api.updateMember>[1]) =>
      api.updateMember(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
      navigate('/members')
    },
  })

  if (isPending) return <p className="text-muted-foreground">読み込み中…</p>
  if (!member)
    return <p className="text-sm text-destructive">メンバーが見つかりません</p>

  return (
    <MemberForm
      initial={member}
      submitLabel="更新"
      onSubmit={async (input) => {
        await update.mutateAsync(input)
      }}
    />
  )
}

export function EditMemberPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/members">
          <ChevronLeft /> メンバー管理
        </Link>
      </Button>
      <h2 className="text-xl font-semibold">メンバー編集</h2>
      <RequireAdmin>{id && <EditMemberBody id={id} />}</RequireAdmin>
    </div>
  )
}

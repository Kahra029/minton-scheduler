import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { Member } from '@minton/types'
import { api, ApiError } from '@/lib/api'
import { MemberForm } from '@/components/MemberForm'
import { AdminGate } from '@/components/AdminGate'
import { Button } from '@/components/ui/button'

function EditMemberBody({ id }: { id: string }) {
  const navigate = useNavigate()
  const [member, setMember] = useState<Member | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 単体取得 API は無いため一覧から該当メンバーを引く
    api
      .listMembers()
      .then((members) => {
        const found = members.find((m) => m.id === id)
        if (found) setMember(found)
        else setError('メンバーが見つかりません')
      })
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : '読み込みに失敗しました')
      )
  }, [id])

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!member) return <p className="text-muted-foreground">読み込み中…</p>

  return (
    <MemberForm
      initial={member}
      submitLabel="更新"
      onSubmit={async (input) => {
        await api.updateMember(id, input)
        navigate('/members')
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
      <AdminGate>{id && <EditMemberBody id={id} />}</AdminGate>
    </div>
  )
}

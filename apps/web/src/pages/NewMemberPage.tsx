import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { MemberForm } from '@/components/MemberForm'
import { RequireAdmin } from '@/components/RequireAdmin'
import { Button } from '@/components/ui/button'

export function NewMemberPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: api.createMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
      navigate('/members')
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/members">
          <ChevronLeft /> メンバー管理
        </Link>
      </Button>
      <h2 className="text-xl font-semibold">メンバー追加</h2>
      <RequireAdmin>
        <MemberForm
          submitLabel="追加"
          onSubmit={async (input) => {
            await create.mutateAsync(input)
          }}
        />
      </RequireAdmin>
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { EventForm } from '@/components/EventForm'
import { RequireAdmin } from '@/components/RequireAdmin'
import { Button } from '@/components/ui/button'

export function NewEventPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: api.createEvent,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['events'] })
      navigate(created.length > 1 ? '/' : `/events/${created[0].id}`)
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/">
          <ChevronLeft /> イベント一覧
        </Link>
      </Button>
      <h2 className="text-xl font-semibold">イベント作成</h2>
      <RequireAdmin>
        <EventForm
          mode="create"
          submitLabel="作成"
          onSubmit={async (input) => {
            await create.mutateAsync(input)
          }}
        />
      </RequireAdmin>
    </div>
  )
}

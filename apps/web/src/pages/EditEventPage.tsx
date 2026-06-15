import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import { EventForm } from '@/components/EventForm'
import { RequireAdmin } from '@/components/RequireAdmin'
import { Button } from '@/components/ui/button'

function EditEventBody({ id }: { id: string }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: event, isPending, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.getEvent(id),
  })

  const update = useMutation({
    mutationFn: (input: Parameters<typeof api.updateEvent>[1]) =>
      api.updateEvent(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      qc.invalidateQueries({ queryKey: ['event', id] })
      navigate(`/events/${id}`)
    },
  })

  const del = useMutation({
    mutationFn: () => api.deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      navigate('/')
    },
  })

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof ApiError ? error.message : '読み込みに失敗しました'}
      </p>
    )
  }
  if (isPending || !event) {
    return <p className="text-muted-foreground">読み込み中…</p>
  }

  return (
    <>
      <EventForm
        mode="edit"
        initial={event}
        submitLabel="更新"
        onSubmit={async (input) => {
          await update.mutateAsync(input)
        }}
      />
      <Button
        type="button"
        variant="destructive"
        className="mt-4 w-full"
        onClick={() => {
          if (confirm(`「${event.title}」を削除しますか？`)) del.mutate()
        }}
      >
        <Trash2 /> このイベントを削除
      </Button>
    </>
  )
}

export function EditEventPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to={`/events/${id}`}>
          <ChevronLeft /> イベント詳細
        </Link>
      </Button>
      <h2 className="text-xl font-semibold">イベント編集</h2>
      <RequireAdmin>{id && <EditEventBody id={id} />}</RequireAdmin>
    </div>
  )
}

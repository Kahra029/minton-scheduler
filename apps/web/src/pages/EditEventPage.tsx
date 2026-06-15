import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import type { EventDetail } from '@minton/types'
import { api, ApiError } from '@/lib/api'
import { EventForm } from '@/components/EventForm'
import { AdminGate } from '@/components/AdminGate'
import { Button } from '@/components/ui/button'

export function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api
      .getEvent(id)
      .then(setEvent)
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : '読み込みに失敗しました')
      )
  }, [id])

  async function handleDelete() {
    if (!id || !event) return
    if (!confirm(`「${event.title}」を削除しますか？`)) return
    try {
      await api.deleteEvent(id)
      navigate('/')
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : '削除に失敗しました')
    }
  }

  if (error && !event) {
    return <p className="py-8 text-center text-destructive">{error}</p>
  }
  if (!event) {
    return <p className="py-8 text-center text-muted-foreground">読み込み中…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to={`/events/${id}`}>
          <ChevronLeft /> イベント詳細
        </Link>
      </Button>
      <h2 className="text-xl font-semibold">イベント編集</h2>
      <AdminGate>
        <EventForm
          mode="edit"
          initial={event}
          submitLabel="更新"
          onSubmit={async (input) => {
            await api.updateEvent(id!, input)
            navigate(`/events/${id}`)
          }}
        />
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={handleDelete}
        >
          <Trash2 /> このイベントを削除
        </Button>
      </AdminGate>
    </div>
  )
}

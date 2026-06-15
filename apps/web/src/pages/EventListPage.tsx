import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import { EventCard } from '@/components/EventCard'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function EventListPage() {
  const { isAdmin } = useAuth()
  const {
    data: events,
    isPending,
    error,
  } = useQuery({ queryKey: ['events'], queryFn: api.listEvents })

  return (
    <div className="flex flex-col gap-3">
      {isAdmin && (
        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link to="/events/new">
              <Plus /> イベント作成
            </Link>
          </Button>
        </div>
      )}

      {error && (
        <p className="py-8 text-center text-destructive">
          {error instanceof ApiError ? error.message : '読み込みに失敗しました'}
        </p>
      )}
      {isPending && (
        <p className="py-8 text-center text-muted-foreground">読み込み中…</p>
      )}
      {events?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          イベントがまだありません
        </p>
      )}
      {events?.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

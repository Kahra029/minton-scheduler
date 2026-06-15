import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { EventListItem } from '@minton/types'
import { api, ApiError } from '@/lib/api'
import { EventCard } from '@/components/EventCard'
import { Button } from '@/components/ui/button'
import { useAdminToken } from '@/hooks/useAdminToken'

export function EventListPage() {
  const [events, setEvents] = useState<EventListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const token = useAdminToken()

  useEffect(() => {
    api
      .listEvents()
      .then(setEvents)
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : '読み込みに失敗しました')
      )
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {token && (
        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link to="/events/new">
              <Plus /> イベント作成
            </Link>
          </Button>
        </div>
      )}

      {error && <p className="py-8 text-center text-destructive">{error}</p>}
      {!error && !events && (
        <p className="py-8 text-center text-muted-foreground">読み込み中…</p>
      )}
      {!error && events?.length === 0 && (
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

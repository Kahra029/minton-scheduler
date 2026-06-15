import { useEffect, useState } from 'react'
import type { EventListItem } from '@minton/types'
import { api, ApiError } from '@/lib/api'
import { EventCard } from '@/components/EventCard'

export function EventListPage() {
  const [events, setEvents] = useState<EventListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listEvents()
      .then(setEvents)
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : '読み込みに失敗しました')
      )
  }, [])

  if (error) {
    return <p className="py-8 text-center text-destructive">{error}</p>
  }
  if (!events) {
    return <p className="py-8 text-center text-muted-foreground">読み込み中…</p>
  }
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        イベントがまだありません
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

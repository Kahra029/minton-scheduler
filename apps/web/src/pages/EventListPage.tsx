import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
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

  const today = dayjs().format('YYYY-MM-DD')
  const byDateAsc = (a: { date: string }, b: { date: string }) =>
    a.date.localeCompare(b.date)
  // 本日以降を昇順、終了分 (本日より前) は下にまとめて昇順
  const upcoming = (events ?? []).filter((e) => e.date >= today).sort(byDateAsc)
  const past = (events ?? []).filter((e) => e.date < today).sort(byDateAsc)

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

      {upcoming.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}

      {past.length > 0 && (
        <>
          <h3 className="mt-4 text-sm font-medium text-muted-foreground">
            終了したイベント
          </h3>
          {past.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </>
      )}
    </div>
  )
}

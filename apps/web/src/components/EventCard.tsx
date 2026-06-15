import { Link } from 'react-router-dom'
import type { EventListItem } from '@minton/types'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EventStatusBadge } from '@/components/EventStatusBadge'
import { AttendanceSummaryBadges } from '@/components/AttendanceSummaryBadges'
import { formatDate } from '@/lib/attendance'

export function EventCard({ event }: { event: EventListItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{event.title}</CardTitle>
        <CardAction>
          <EventStatusBadge status={event.status} />
        </CardAction>
        <CardDescription>
          {formatDate(event.date)} {event.start_time}–{event.end_time}
          <span className="mx-1">・</span>
          {event.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <AttendanceSummaryBadges summary={event.summary} />
        <Button asChild variant="outline" size="sm">
          <Link to={`/events/${event.id}`}>出欠を見る</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

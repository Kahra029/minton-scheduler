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
import { EventStatusBadge } from '@/components/EventStatusBadge'
import { AttendanceSummaryBadges } from '@/components/AttendanceSummaryBadges'
import { formatDate } from '@/lib/attendance'

export function EventCard({ event }: { event: EventListItem }) {
  return (
    <Link to={`/events/${event.id}`} className="block">
      <Card className="transition-colors hover:border-foreground/20 hover:bg-accent/30">
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
        <CardContent>
          <AttendanceSummaryBadges summary={event.summary} />
        </CardContent>
      </Card>
    </Link>
  )
}

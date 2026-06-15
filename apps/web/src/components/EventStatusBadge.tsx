import type { EventStatus } from '@minton/types'
import { Badge } from '@/components/ui/badge'

const META: Record<
  EventStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  draft: { label: '下書き', variant: 'secondary' },
  open: { label: '受付中', variant: 'default' },
  closed: { label: '締切', variant: 'outline' },
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const meta = META[status]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

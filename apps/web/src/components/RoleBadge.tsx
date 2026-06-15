import type { MemberRole } from '@minton/types'
import { Badge } from '@/components/ui/badge'

const META: Record<
  MemberRole,
  { label: string; variant: 'default' | 'secondary' }
> = {
  admin: { label: '幹事', variant: 'default' },
  member: { label: 'メンバー', variant: 'secondary' },
}

export function RoleBadge({ role }: { role: MemberRole }) {
  const meta = META[role]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

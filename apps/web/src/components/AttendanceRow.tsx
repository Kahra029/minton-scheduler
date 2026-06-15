import type { AttendanceStatus } from '@minton/types'
import { cn } from '@/lib/utils'
import { STATUS_META, STATUS_ORDER } from '@/lib/attendance'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface AttendanceRowProps {
  memberName: string
  status: AttendanceStatus | null
  disabled?: boolean
  /** ログイン中の本人の行か */
  isSelf?: boolean
  onChange: (status: AttendanceStatus) => void
}

/** メンバー行 + 4択トグル (spec 2.2.3 / 6.2 AttendanceRow) */
export function AttendanceRow({
  memberName,
  status,
  disabled,
  isSelf,
  onChange,
}: AttendanceRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-2 py-2',
        isSelf ? 'rounded-md bg-accent/40' : 'border-b last:border-b-0',
      )}
    >
      <div className="w-20 shrink-0 sm:w-28">
        <span className="block truncate text-sm font-medium">{memberName}</span>
        {isSelf && (
          <Badge variant="secondary" className="mt-0.5 px-1 py-0 text-[10px]">
            あなた
          </Badge>
        )}
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={status ?? ''}
        onValueChange={(v) => {
          if (v) onChange(v as AttendanceStatus)
        }}
        disabled={disabled}
        className="flex-1"
      >
        {STATUS_ORDER.map((s) => (
          <ToggleGroupItem
            key={s}
            value={s}
            aria-label={STATUS_META[s].label}
            className={cn('h-11 flex-col gap-0.5', STATUS_META[s].activeClass)}
          >
            <span className="text-base leading-none">
              {STATUS_META[s].symbol}
            </span>
            <span className="text-[10px] leading-none">
              {STATUS_META[s].label}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

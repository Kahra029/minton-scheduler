import type { AttendanceStatus } from '@minton/types'
import { cn } from '@/lib/utils'
import { STATUS_META, STATUS_ORDER } from '@/lib/attendance'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface AttendanceRowProps {
  memberName: string
  status: AttendanceStatus | null
  disabled?: boolean
  onChange: (status: AttendanceStatus) => void
}

/** メンバー行 + 4択トグル (spec 2.2.3 / 6.2 AttendanceRow) */
export function AttendanceRow({
  memberName,
  status,
  disabled,
  onChange,
}: AttendanceRowProps) {
  return (
    <div className="flex items-center gap-3 border-b py-2 last:border-b-0">
      <span className="w-20 shrink-0 truncate text-sm font-medium sm:w-28">
        {memberName}
      </span>
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

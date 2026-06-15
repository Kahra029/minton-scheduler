import type { AttendanceSummary } from '@minton/types'
import { cn } from '@/lib/utils'
import { STATUS_META, STATUS_ORDER } from '@/lib/attendance'

/** ○n / □n / △n / ×n の集計バッジ列 (spec 2.2.4) */
export function AttendanceSummaryBadges({
  summary,
}: {
  summary: AttendanceSummary
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums">
      {STATUS_ORDER.map((s) => (
        <span key={s} className={cn('font-semibold', STATUS_META[s].textClass)}>
          {STATUS_META[s].symbol}
          {summary[s]}
        </span>
      ))}
      {summary.no_response > 0 && (
        <span className="text-muted-foreground">未{summary.no_response}</span>
      )}
    </div>
  )
}

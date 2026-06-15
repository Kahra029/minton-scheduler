import type { AttendanceSummary } from '@minton/types'
import { cn } from '@/lib/utils'
import { STATUS_META, STATUS_ORDER } from '@/lib/attendance'

/**
 * 出欠集計バッジ列。
 * - labeled=false (一覧カード): ○n □n △n ×n / 未n  (コンパクト)
 * - labeled=true  (詳細ページ): 参加○n 途中参加□n 早退△n ×n 未定n
 */
export function AttendanceSummaryBadges({
  summary,
  labeled = false,
}: {
  summary: AttendanceSummary
  labeled?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums">
      {STATUS_ORDER.map((s) => (
        <span key={s} className={cn('font-semibold', STATUS_META[s].textClass)}>
          {labeled && s !== 'absent' && STATUS_META[s].label}
          {STATUS_META[s].symbol}
          {summary[s]}
        </span>
      ))}
      {labeled ? (
        <span className="text-muted-foreground">未定{summary.no_response}</span>
      ) : (
        summary.no_response > 0 && (
          <span className="text-muted-foreground">未{summary.no_response}</span>
        )
      )}
    </div>
  )
}

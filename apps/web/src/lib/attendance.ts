import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import type {
  AttendanceStatus,
  AttendanceEntry,
  AttendanceSummary,
} from '@minton/types'

dayjs.locale('ja')

/** 出欠ステータスの表示メタ情報 (記号・ラベル・配色) */
export interface StatusMeta {
  symbol: string
  label: string
  /** バッジ/ボタンの選択時クラス (Tailwind) */
  activeClass: string
  /** 集計バッジの文字色クラス */
  textClass: string
}

export const STATUS_META: Record<AttendanceStatus, StatusMeta> = {
  present: {
    symbol: '○',
    label: '参加',
    activeClass:
      'data-[state=on]:bg-emerald-500 data-[state=on]:text-white',
    textClass: 'text-emerald-600',
  },
  partial: {
    symbol: '□',
    label: '途中参加',
    activeClass: 'data-[state=on]:bg-sky-500 data-[state=on]:text-white',
    textClass: 'text-sky-600',
  },
  leave_early: {
    symbol: '△',
    label: '早退',
    activeClass: 'data-[state=on]:bg-amber-500 data-[state=on]:text-white',
    textClass: 'text-amber-600',
  },
  absent: {
    symbol: '×',
    label: '不参加',
    activeClass: 'data-[state=on]:bg-rose-500 data-[state=on]:text-white',
    textClass: 'text-rose-600',
  },
}

/** ボタン/集計の表示順 */
export const STATUS_ORDER: AttendanceStatus[] = [
  'present',
  'partial',
  'leave_early',
  'absent',
]

/** YYYY-MM-DD → "6/17 (水)" のような表示 */
export function formatDate(date: string): string {
  return dayjs(date).format('M/D (dd)')
}

/** 出欠一覧から集計を再計算する (楽観的更新後の表示用。バック summarize と同ロジック) */
export function summarizeEntries(
  entries: AttendanceEntry[]
): AttendanceSummary {
  const summary: AttendanceSummary = {
    present: 0,
    partial: 0,
    leave_early: 0,
    absent: 0,
    no_response: 0,
  }
  for (const e of entries) {
    if (e.status === null) summary.no_response += 1
    else summary[e.status] += 1
  }
  return summary
}

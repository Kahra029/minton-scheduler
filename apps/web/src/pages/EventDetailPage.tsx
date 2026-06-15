import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Pencil } from 'lucide-react'
import type { AttendanceStatus, EventDetail } from '@minton/types'
import { api, ApiError } from '@/lib/api'
import { STATUS_META, STATUS_ORDER, formatDate, summarizeEntries } from '@/lib/attendance'
import { cn } from '@/lib/utils'
import { AttendanceRow } from '@/components/AttendanceRow'
import { EventStatusBadge } from '@/components/EventStatusBadge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

const PAGE_SIZE = 20

/** detail の出欠一覧から指定メンバーのステータスを差し替えた新しい detail を返す */
function applyStatus(
  detail: EventDetail,
  memberId: string,
  status: AttendanceStatus,
  updatedAt: string
): EventDetail {
  const attendance = detail.attendance.map((entry) =>
    entry.member_id === memberId
      ? { ...entry, status, updated_at: updatedAt }
      : entry
  )
  return { ...detail, attendance, summary: summarizeEntries(attendance) }
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<EventDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (!id) return
    api
      .getEvent(id)
      .then(setDetail)
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : '読み込みに失敗しました')
      )
  }, [id])

  async function handleChange(memberId: string, status: AttendanceStatus) {
    if (!detail) return
    const prev = detail
    // 楽観的更新: 先に画面へ反映してから保存する
    setDetail(applyStatus(detail, memberId, status, new Date().toISOString()))
    setSavingId(memberId)
    setError(null)
    try {
      await api.upsertAttendance({
        event_id: detail.id,
        member_id: memberId,
        status,
      })
    } catch (e: unknown) {
      setDetail(prev) // 失敗したら元に戻す
      setError(e instanceof ApiError ? e.message : '保存に失敗しました')
    } finally {
      setSavingId(null)
    }
  }

  if (error && !detail) {
    return <p className="py-8 text-center text-destructive">{error}</p>
  }
  if (!detail) {
    return <p className="py-8 text-center text-muted-foreground">読み込み中…</p>
  }

  // 自分を先頭に、残りは role 昇順 → name 昇順 (admin / member 問わず)
  const others = detail.attendance
    .filter((e) => e.member_id !== user?.id)
    .sort((a, b) =>
      a.member_role !== b.member_role
        ? a.member_role.localeCompare(b.member_role)
        : a.member_name.localeCompare(b.member_name, 'ja'),
    )
  const self = detail.attendance.filter((e) => e.member_id === user?.id)
  const ordered = [...self, ...others]
  const shown = ordered.slice(0, visible)
  const remaining = ordered.length - shown.length

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/">
          <ChevronLeft /> イベント一覧
        </Link>
      </Button>

      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-semibold">{detail.title}</h2>
          <div className="flex shrink-0 items-center gap-2">
            <EventStatusBadge status={detail.status} />
            {isAdmin && (
              <Button asChild size="sm" variant="outline">
                <Link to={`/events/${detail.id}/edit`}>
                  <Pencil /> 編集
                </Link>
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(detail.date)} {detail.start_time}–{detail.end_time}
          <span className="mx-1">・</span>
          {detail.location}
        </p>
        {detail.note && (
          <p className="text-sm whitespace-pre-wrap">{detail.note}</p>
        )}
      </div>

      {/* サマリ: 名前列ぶんの余白 + 4列グリッドで下のトグル各列に揃える */}
      <div className="flex items-center gap-3 rounded-lg border bg-card py-2 pr-2 pl-2">
        <div className="w-20 shrink-0 text-xs font-medium text-muted-foreground sm:w-28">
          全{detail.attendance.length}名
        </div>
        <div className="grid flex-1 grid-cols-4">
          {STATUS_ORDER.map((s) => (
            <span
              key={s}
              className={cn(
                'text-center text-xs font-semibold tabular-nums',
                STATUS_META[s].textClass,
              )}
            >
              {s !== 'absent' && STATUS_META[s].label}
              {STATUS_META[s].symbol}
              {detail.summary[s]}
            </span>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        {shown.map((entry) => (
          <AttendanceRow
            key={entry.member_id}
            memberName={entry.member_name}
            status={entry.status}
            isSelf={user?.id === entry.member_id}
            disabled={
              savingId === entry.member_id ||
              !(isAdmin || user?.id === entry.member_id)
            }
            onChange={(status) => handleChange(entry.member_id, status)}
          />
        ))}
        {detail.attendance.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            メンバーが登録されていません
          </p>
        )}
      </div>

      {remaining > 0 && (
        <Button
          variant="outline"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
        >
          残り {remaining} 件を表示
        </Button>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Minus, Pencil, Plus } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { AttendanceStatus, EventDetail } from '@minton/types'
import { api, ApiError } from '@/lib/api'
import {
  STATUS_META,
  STATUS_ORDER,
  formatDate,
  summarizeEntries,
} from '@/lib/attendance'
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
  updatedAt: string,
): EventDetail {
  const attendance = detail.attendance.map((entry) =>
    entry.member_id === memberId
      ? { ...entry, status, updated_at: updatedAt }
      : entry,
  )
  return { ...detail, attendance, summary: summarizeEntries(attendance) }
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [visible, setVisible] = useState(PAGE_SIZE)

  const {
    data: detail,
    isPending,
    error,
  } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.getEvent(id!),
    enabled: !!id,
  })

  const upsert = useMutation({
    mutationFn: (vars: { member_id: string; status: AttendanceStatus }) =>
      api.upsertAttendance({ event_id: id!, ...vars }),
    // 楽観的更新: 先にキャッシュを書き換え、失敗時に戻す
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['event', id] })
      const prev = qc.getQueryData<EventDetail>(['event', id])
      if (prev) {
        qc.setQueryData(
          ['event', id],
          applyStatus(prev, vars.member_id, vars.status, dayjs().toISOString()),
        )
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['event', id], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['event', id] })
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })

  // ビジター人数の更新 (admin のみ)。楽観的更新
  const visitor = useMutation({
    mutationFn: (count: number) => api.updateEvent(id!, { visitor_count: count }),
    onMutate: async (count) => {
      await qc.cancelQueries({ queryKey: ['event', id] })
      const prev = qc.getQueryData<EventDetail>(['event', id])
      if (prev) qc.setQueryData(['event', id], { ...prev, visitor_count: count })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['event', id], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['event', id] })
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })

  if (error && !detail) {
    return (
      <p className="py-8 text-center text-destructive">
        {error instanceof ApiError ? error.message : '読み込みに失敗しました'}
      </p>
    )
  }
  if (isPending || !detail) {
    return <p className="py-8 text-center text-muted-foreground">読み込み中…</p>
  }

  // 自分を先頭に、残りは role 昇順 → name 昇順
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
          出席
          {detail.summary.present +
            detail.summary.partial +
            detail.summary.leave_early +
            detail.visitor_count}
          名
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
              {s !== 'absent' && (
                <span className="hidden sm:inline">{STATUS_META[s].label}</span>
              )}
              {STATUS_META[s].symbol}
              {detail.summary[s]}
            </span>
          ))}
        </div>
      </div>

      {/* ビジター (メンバー外参加者)。admin は増減、member は閲覧 */}
      {(isAdmin || detail.visitor_count > 0) && (
        <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
          <span className="text-sm font-medium">ビジター</span>
          {isAdmin ? (
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                aria-label="減らす"
                disabled={detail.visitor_count <= 0}
                onClick={() => visitor.mutate(detail.visitor_count - 1)}
              >
                <Minus />
              </Button>
              <span className="w-6 text-center tabular-nums">
                {detail.visitor_count}
              </span>
              <Button
                size="icon"
                variant="outline"
                aria-label="増やす"
                onClick={() => visitor.mutate(detail.visitor_count + 1)}
              >
                <Plus />
              </Button>
            </div>
          ) : (
            <span className="text-sm tabular-nums">{detail.visitor_count}名</span>
          )}
        </div>
      )}

      {upsert.isError && (
        <p className="text-sm text-destructive">出欠の保存に失敗しました</p>
      )}

      <div>
        {shown.map((entry) => (
          <AttendanceRow
            key={entry.member_id}
            memberName={entry.member_name}
            status={entry.status}
            isSelf={user?.id === entry.member_id}
            disabled={
              (upsert.isPending &&
                upsert.variables?.member_id === entry.member_id) ||
              !(isAdmin || user?.id === entry.member_id)
            }
            onChange={(status) =>
              upsert.mutate({ member_id: entry.member_id, status })
            }
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

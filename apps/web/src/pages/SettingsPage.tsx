import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updateFeeSettingsSchema } from '@minton/types'
import type { FeeSettings } from '@minton/types'
import { api, ApiError } from '@/lib/api'
import { RequireAdmin } from '@/components/RequireAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FIELDS = [
  { key: 'fee_present', label: '参加' },
  { key: 'fee_partial', label: '途中参加（遅刻）' },
  { key: 'fee_leave_early', label: '早退' },
  { key: 'fee_visitor', label: 'ビジター' },
] as const

function FeeForm({ initial }: { initial: FeeSettings }) {
  const qc = useQueryClient()
  const update = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: (d) => qc.setQueryData(['settings'], d),
  })
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FeeSettings>({
    resolver: zodResolver(updateFeeSettingsSchema),
    defaultValues: initial,
  })

  const submit = handleSubmit(async (v) => {
    try {
      await update.mutateAsync(v)
    } catch (e) {
      setError('root', {
        message: e instanceof ApiError ? e.message : '保存に失敗しました',
      })
    }
  })

  return (
    <form onSubmit={submit} className="space-y-4">
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1">
          <Label htmlFor={f.key}>{f.label}（円）</Label>
          <Input
            id={f.key}
            type="number"
            min={0}
            {...register(f.key, { valueAsNumber: true })}
          />
          {errors[f.key] && (
            <p className="text-sm text-destructive">{errors[f.key]?.message}</p>
          )}
        </div>
      ))}
      {update.isSuccess && (
        <p className="text-sm text-emerald-600">保存しました</p>
      )}
      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? '保存中…' : '保存'}
      </Button>
    </form>
  )
}

function SettingsBody() {
  const { data, isPending } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
  })
  if (isPending || !data) {
    return <p className="text-muted-foreground">読み込み中…</p>
  }
  return (
    <>
      <p className="text-sm text-muted-foreground">
        出欠ステータスごとの単価（全体共通）。イベント詳細に集金の合計金額が表示されます。
      </p>
      <FeeForm initial={data} />
    </>
  )
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/">
          <ChevronLeft /> イベント一覧
        </Link>
      </Button>
      <h2 className="text-xl font-semibold">料金設定</h2>
      <RequireAdmin>
        <SettingsBody />
      </RequireAdmin>
    </div>
  )
}

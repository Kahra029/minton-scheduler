import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CreateEventInput, Event, EventStatus, Recurrence } from '@minton/types'
import { eventStatusSchema, recurrenceSchema } from '@minton/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: '下書き' },
  { value: 'open', label: '受付中' },
  { value: 'closed', label: '終了' },
]

const RECURRENCE_OPTIONS: { value: Recurrence['type']; label: string }[] = [
  { value: 'weekly', label: '毎週' },
  { value: 'biweekly', label: '隔週' },
  { value: 'monthly', label: '月1回' },
]

const formSchema = z
  .object({
    title: z.string().min(1, 'タイトルは必須です'),
    date: z.string().min(1, '日付は必須です'),
    start_time: z.string().min(1, '開始時刻は必須です'),
    end_time: z.string().min(1, '終了時刻は必須です'),
    location: z.string().min(1, '場所は必須です'),
    note: z.string(),
    status: eventStatusSchema,
    recurring: z.boolean(),
    recurrenceType: recurrenceSchema.shape.type,
    recurrenceUntil: z.string(),
  })
  .refine((d) => !d.recurring || d.recurrenceUntil.length > 0, {
    message: '定期開催の終了日を入力してください',
    path: ['recurrenceUntil'],
  })
type FormValues = z.infer<typeof formSchema>

interface EventFormProps {
  mode: 'create' | 'edit'
  initial?: Event
  submitLabel: string
  onSubmit: (input: CreateEventInput) => Promise<void>
}

export function EventForm({
  mode,
  initial,
  submitLabel,
  onSubmit,
}: EventFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initial?.title ?? '',
      date: initial?.date ?? '',
      start_time: initial?.start_time ?? '19:00',
      end_time: initial?.end_time ?? '21:00',
      location: initial?.location ?? '',
      note: initial?.note ?? '',
      status: initial?.status ?? 'draft',
      recurring: false,
      recurrenceType: 'weekly',
      recurrenceUntil: '',
    },
  })

  const showRecurrence = mode === 'create'
  const recurring = watch('recurring')
  const date = watch('date')

  const submit = handleSubmit(async (v) => {
    try {
      await onSubmit({
        title: v.title,
        date: v.date,
        start_time: v.start_time,
        end_time: v.end_time,
        location: v.location,
        note: v.note.trim() ? v.note : null,
        status: v.status,
        recurrence:
          showRecurrence && v.recurring
            ? { type: v.recurrenceType, until: v.recurrenceUntil }
            : null,
      })
    } catch (e) {
      setError('root', {
        message: e instanceof Error ? e.message : '保存に失敗しました',
      })
    }
  })

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" {...register('title')} placeholder="水曜練習" />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="date">日付</Label>
        <Input id="date" type="date" {...register('date')} />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="start">開始</Label>
          <Input id="start" type="time" {...register('start_time')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end">終了</Label>
          <Input id="end" type="time" {...register('end_time')} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="location">場所</Label>
        <Input id="location" {...register('location')} placeholder="市民体育館" />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="note">メモ</Label>
        <Textarea id="note" {...register('note')} placeholder="任意" />
      </div>

      <div className="space-y-1">
        <Label>ステータス</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {showRecurrence && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="recurring">定期開催</Label>
            <Controller
              control={control}
              name="recurring"
              render={({ field }) => (
                <Switch
                  id="recurring"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          {recurring && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>繰り返し</Label>
                <Controller
                  control={control}
                  name="recurrenceType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="until">終了日</Label>
                <Input
                  id="until"
                  type="date"
                  min={date || undefined}
                  {...register('recurrenceUntil')}
                />
                {errors.recurrenceUntil && (
                  <p className="text-sm text-destructive">
                    {errors.recurrenceUntil.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? '保存中…' : submitLabel}
      </Button>
    </form>
  )
}

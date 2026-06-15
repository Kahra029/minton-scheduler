import { useState, type FormEvent } from 'react'
import type {
  CreateEventInput,
  Event,
  EventStatus,
  Recurrence,
} from '@minton/types'
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
  { value: 'closed', label: '締切' },
]

const RECURRENCE_OPTIONS: { value: Recurrence['type']; label: string }[] = [
  { value: 'weekly', label: '毎週' },
  { value: 'biweekly', label: '隔週' },
  { value: 'monthly', label: '月1回' },
]

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
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [startTime, setStartTime] = useState(initial?.start_time ?? '19:00')
  const [endTime, setEndTime] = useState(initial?.end_time ?? '21:00')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [status, setStatus] = useState<EventStatus>(initial?.status ?? 'draft')

  const [recurring, setRecurring] = useState(false)
  const [recType, setRecType] = useState<Recurrence['type']>('weekly')
  const [recUntil, setRecUntil] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showRecurrence = mode === 'create'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (showRecurrence && recurring && !recUntil) {
      setError('定期開催の終了日を入力してください')
      return
    }

    const input: CreateEventInput = {
      title,
      date,
      start_time: startTime,
      end_time: endTime,
      location,
      note: note.trim() ? note : null,
      status,
      recurrence:
        showRecurrence && recurring ? { type: recType, until: recUntil } : null,
    }

    setSubmitting(true)
    try {
      await onSubmit(input)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="水曜練習"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="date">日付</Label>
        <Input
          id="date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="start">開始</Label>
          <Input
            id="start"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end">終了</Label>
          <Input
            id="end"
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="location">場所</Label>
        <Input
          id="location"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="市民体育館"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="note">メモ</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="任意"
        />
      </div>

      <div className="space-y-1">
        <Label>ステータス</Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as EventStatus)}
        >
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
      </div>

      {showRecurrence && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="recurring">定期開催</Label>
            <Switch
              id="recurring"
              checked={recurring}
              onCheckedChange={setRecurring}
            />
          </div>
          {recurring && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>繰り返し</Label>
                <Select
                  value={recType}
                  onValueChange={(v) => setRecType(v as Recurrence['type'])}
                >
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
              </div>
              <div className="space-y-1">
                <Label htmlFor="until">終了日</Label>
                <Input
                  id="until"
                  type="date"
                  value={recUntil}
                  min={date || undefined}
                  onChange={(e) => setRecUntil(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? '保存中…' : submitLabel}
      </Button>
    </form>
  )
}

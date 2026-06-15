import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTemplateSchema } from '@minton/types'
import type { CreateTemplateInput, EventTemplate } from '@minton/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface TemplateFormProps {
  initial?: EventTemplate
  submitLabel: string
  onSubmit: (input: CreateTemplateInput) => Promise<void>
}

export function TemplateForm({
  initial,
  submitLabel,
  onSubmit,
}: TemplateFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: initial?.name ?? '',
      start_time: initial?.start_time ?? '19:00',
      end_time: initial?.end_time ?? '21:00',
      location: initial?.location ?? '',
      note: initial?.note ?? '',
    },
  })

  const submit = handleSubmit(async (v) => {
    try {
      await onSubmit({
        name: v.name,
        start_time: v.start_time,
        end_time: v.end_time,
        location: v.location,
        note: v.note ? v.note : null,
      })
      if (!initial) reset()
    } catch (e) {
      setError('root', {
        message: e instanceof Error ? e.message : '保存に失敗しました',
      })
    }
  })

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="name">テンプレート名</Label>
        <Input id="name" {...register('name')} placeholder="木曜練習" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
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
      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? '保存中…' : submitLabel}
      </Button>
    </form>
  )
}

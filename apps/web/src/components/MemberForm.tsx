import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CreateMemberInput, Member, MemberRole } from '@minton/types'
import { memberRoleSchema } from '@minton/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'member', label: 'メンバー' },
  { value: 'admin', label: '幹事 (admin)' },
]

const formSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  role: memberRoleSchema,
  email: z.union([
    z.literal(''),
    z.string().email('メールアドレスの形式が不正です'),
  ]),
})
type FormValues = z.infer<typeof formSchema>

interface MemberFormProps {
  initial?: Member
  submitLabel: string
  onSubmit: (input: CreateMemberInput) => Promise<void>
}

export function MemberForm({ initial, submitLabel, onSubmit }: MemberFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.name ?? '',
      role: initial?.role ?? 'member',
      email: initial?.email ?? '',
    },
  })

  const submit = handleSubmit(async (v) => {
    try {
      await onSubmit({ name: v.name, role: v.role, email: v.email || null })
    } catch (e) {
      setError('root', {
        message: e instanceof Error ? e.message : '保存に失敗しました',
      })
    }
  })

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">名前</Label>
        <Input id="name" {...register('name')} placeholder="山田太郎" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">メールアドレス（ログイン用）</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label>ロール</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
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

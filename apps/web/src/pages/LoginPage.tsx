import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { requestOtpSchema } from '@minton/types'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '6桁の数字コードを入力してください'),
})

export function LoginPage() {
  const { requestOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const emailForm = useForm<z.infer<typeof requestOtpSchema>>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { email: '' },
  })
  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  })

  const submitEmail = emailForm.handleSubmit(async ({ email }) => {
    try {
      await requestOtp(email)
      setEmail(email)
    } catch (e) {
      emailForm.setError('root', {
        message: e instanceof ApiError ? e.message : '送信に失敗しました',
      })
    }
  })

  const submitCode = codeForm.handleSubmit(async ({ code }) => {
    try {
      await verifyOtp(email, code)
      navigate('/')
    } catch (e) {
      codeForm.setError('root', {
        message: e instanceof ApiError ? e.message : 'ログインに失敗しました',
      })
    }
  })

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h2 className="text-xl font-semibold">ログイン</h2>

      {!email ? (
        <form onSubmit={submitEmail} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...emailForm.register('email')}
            />
            {emailForm.formState.errors.email && (
              <p className="text-sm text-destructive">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>
          {emailForm.formState.errors.root && (
            <p className="text-sm text-destructive">
              {emailForm.formState.errors.root.message}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={emailForm.formState.isSubmitting}
          >
            {emailForm.formState.isSubmitting
              ? '送信中…'
              : 'ログインコードを送信'}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {email} にログインコードを送信しました。メールに記載の6桁コードを入力してください。
          </p>
          <div className="space-y-1">
            <Label htmlFor="code">ログインコード</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              {...codeForm.register('code')}
            />
            {codeForm.formState.errors.code && (
              <p className="text-sm text-destructive">
                {codeForm.formState.errors.code.message}
              </p>
            )}
          </div>
          {codeForm.formState.errors.root && (
            <p className="text-sm text-destructive">
              {codeForm.formState.errors.root.message}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={codeForm.formState.isSubmitting}
          >
            {codeForm.formState.isSubmitting ? '確認中…' : 'ログイン'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setEmail('')
              codeForm.reset()
            }}
          >
            メールアドレスを変更
          </Button>
        </form>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import { RequireAdmin } from '@/components/RequireAdmin'
import { TemplateForm } from '@/components/TemplateForm'
import { Button } from '@/components/ui/button'

function TemplatesList() {
  const qc = useQueryClient()
  const { data: templates, isPending, error } = useQuery({
    queryKey: ['templates'],
    queryFn: api.listTemplates,
  })
  const create = useMutation({
    mutationFn: api.createTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
  const del = useMutation({
    mutationFn: (id: string) => api.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-sm text-destructive">
          {error instanceof ApiError ? error.message : '読み込みに失敗しました'}
        </p>
      )}
      {isPending && (
        <p className="py-4 text-center text-muted-foreground">読み込み中…</p>
      )}
      {templates?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          テンプレートがまだありません
        </p>
      )}
      {templates?.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          <div className="flex-1">
            <p className="font-medium">{t.name}</p>
            <p className="text-xs text-muted-foreground">
              {t.start_time}–{t.end_time} ・ {t.location}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="削除"
            onClick={() => {
              if (confirm(`テンプレート「${t.name}」を削除しますか？`))
                del.mutate(t.id)
            }}
          >
            <Trash2 />
          </Button>
        </div>
      ))}

      <div className="mt-4 rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-medium">テンプレートを追加</h3>
        <TemplateForm
          submitLabel="追加"
          onSubmit={async (input) => {
            await create.mutateAsync(input)
          }}
        />
      </div>
    </div>
  )
}

export function TemplatesPage() {
  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/">
          <ChevronLeft /> イベント一覧
        </Link>
      </Button>
      <h2 className="text-xl font-semibold">テンプレート管理</h2>
      <RequireAdmin>
        <TemplatesList />
      </RequireAdmin>
    </div>
  )
}

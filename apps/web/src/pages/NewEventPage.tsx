import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/attendance'
import { EventForm } from '@/components/EventForm'
import { RequireAdmin } from '@/components/RequireAdmin'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const NO_TEMPLATE = '__none__'

export function NewEventPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [templateId, setTemplateId] = useState(NO_TEMPLATE)
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: api.listEvents,
  })
  const template =
    templateId !== NO_TEMPLATE
      ? events?.find((e) => e.id === templateId)
      : undefined

  const create = useMutation({
    mutationFn: api.createEvent,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['events'] })
      navigate(created.length > 1 ? '/' : `/events/${created[0].id}`)
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/">
          <ChevronLeft /> イベント一覧
        </Link>
      </Button>
      <h2 className="text-xl font-semibold">イベント作成</h2>
      <RequireAdmin>
        {events && events.length > 0 && (
          <div className="space-y-1">
            <Label>テンプレートから作成（任意）</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TEMPLATE}>テンプレートなし</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title}（{formatDate(e.date)}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              選んだイベントの内容をコピーして新規作成します（日付は調整してください）
            </p>
          </div>
        )}
        {/* テンプレート切替時に初期値を反映するため key で再マウント */}
        <EventForm
          key={templateId}
          mode="create"
          initial={template}
          submitLabel="作成"
          onSubmit={async (input) => {
            await create.mutateAsync(input)
          }}
        />
      </RequireAdmin>
    </div>
  )
}

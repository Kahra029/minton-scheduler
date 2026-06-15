import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { api } from '@/lib/api'
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

/** 今日以降で直近の指定曜日 (0=日..6=土) を YYYY-MM-DD で返す */
function nextWeekday(weekday: number): string {
  const today = dayjs()
  const diff = (weekday - today.day() + 7) % 7
  return today.add(diff, 'day').format('YYYY-MM-DD')
}

export function NewEventPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [templateId, setTemplateId] = useState(NO_TEMPLATE)
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: api.listTemplates,
  })
  const template =
    templateId !== NO_TEMPLATE
      ? templates?.find((t) => t.id === templateId)
      : undefined
  const initial = template
    ? {
        title: template.name,
        start_time: template.start_time,
        end_time: template.end_time,
        location: template.location,
        note: template.note,
        // 曜日があれば直近のその曜日を日付に
        date:
          template.weekday != null ? nextWeekday(template.weekday) : undefined,
      }
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
        {templates && templates.length > 0 && (
          <div className="space-y-1">
            <Label>テンプレートから作成（任意）</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TEMPLATE}>テンプレートなし</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}（{t.start_time}–{t.end_time} {t.location}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {/* テンプレ切替時に初期値を反映するため key で再マウント */}
        <EventForm
          key={templateId}
          mode="create"
          initial={initial}
          submitLabel="作成"
          onSubmit={async (input) => {
            await create.mutateAsync(input)
          }}
        />
      </RequireAdmin>
    </div>
  )
}

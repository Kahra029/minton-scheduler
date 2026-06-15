import type {
  Event,
  EventListItem,
  EventDetail,
  Member,
  Attendance,
  CreateEventInput,
  UpdateEventInput,
  CreateMemberInput,
  UpdateMemberInput,
  UpsertAttendanceInput,
  EventTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  FeeSettings,
  UpdateFeeSettingsInput,
} from '@minton/types'

const BASE = '/api'

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include', // セッション Cookie を送受信する
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    let details: unknown
    try {
      const body = (await res.json()) as { error?: string; details?: unknown }
      if (body?.error) message = body.error
      details = body?.details
    } catch {
      // レスポンスが JSON でない場合はステータス文言のまま
    }
    throw new ApiError(res.status, message, details)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  // --- 認証 ---
  requestOtp: (email: string) =>
    http<{ ok: boolean }>('/auth/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyOtp: (email: string, code: string) =>
    http<Member>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),
  logout: () => http<void>('/auth/logout', { method: 'POST' }),
  me: () => http<Member>('/auth/me'),

  // --- 閲覧 (全員) ---
  listEvents: () => http<EventListItem[]>('/events'),
  getEvent: (id: string) => http<EventDetail>(`/events/${id}`),
  listMembers: () => http<Member[]>('/members'),
  upsertAttendance: (input: UpsertAttendanceInput) =>
    http<Attendance>('/attendance', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  // --- admin 操作 (Cookie のセッションで認可) ---
  // POST は定期開催で複数生成されうるため作成イベントの配列を返す
  createEvent: (input: CreateEventInput) =>
    http<Event[]>('/events', { method: 'POST', body: JSON.stringify(input) }),
  updateEvent: (id: string, input: UpdateEventInput) =>
    http<Event>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteEvent: (id: string) =>
    http<void>(`/events/${id}`, { method: 'DELETE' }),

  createMember: (input: CreateMemberInput) =>
    http<Member>('/members', { method: 'POST', body: JSON.stringify(input) }),
  updateMember: (id: string, input: UpdateMemberInput) =>
    http<Member>(`/members/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteMember: (id: string) =>
    http<void>(`/members/${id}`, { method: 'DELETE' }),

  listTemplates: () => http<EventTemplate[]>('/templates'),
  createTemplate: (input: CreateTemplateInput) =>
    http<EventTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateTemplate: (id: string, input: UpdateTemplateInput) =>
    http<EventTemplate>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  deleteTemplate: (id: string) =>
    http<void>(`/templates/${id}`, { method: 'DELETE' }),

  getSettings: () => http<FeeSettings>('/settings'),
  updateSettings: (input: UpdateFeeSettingsInput) =>
    http<FeeSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
}

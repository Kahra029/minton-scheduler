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
} from '@minton/types'
import { getAdminToken } from './auth'

function adminHeaders(): Record<string, string> {
  return { 'X-Admin-Token': getAdminToken() }
}

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
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
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
  listEvents: () => http<EventListItem[]>('/events'),
  getEvent: (id: string) => http<EventDetail>(`/events/${id}`),
  listMembers: () => http<Member[]>('/members'),
  upsertAttendance: (input: UpsertAttendanceInput) =>
    http<Attendance>('/attendance', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  // --- admin 操作 (X-Admin-Token が必要) ---
  // POST は定期開催で複数生成されうるため作成イベントの配列を返す
  createEvent: (input: CreateEventInput) =>
    http<Event[]>('/events', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: adminHeaders(),
    }),
  updateEvent: (id: string, input: UpdateEventInput) =>
    http<Event>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
      headers: adminHeaders(),
    }),
  deleteEvent: (id: string) =>
    http<void>(`/events/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    }),

  createMember: (input: CreateMemberInput) =>
    http<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: adminHeaders(),
    }),
  updateMember: (id: string, input: UpdateMemberInput) =>
    http<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
      headers: adminHeaders(),
    }),
  deleteMember: (id: string) =>
    http<void>(`/members/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    }),
}

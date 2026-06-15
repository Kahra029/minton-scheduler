import type {
  EventListItem,
  EventDetail,
  Member,
  Attendance,
  UpsertAttendanceInput,
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
}

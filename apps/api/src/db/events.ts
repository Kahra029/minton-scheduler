import type {
  Event,
  EventDetail,
  EventListItem,
  AttendanceStatus,
  AttendanceSummary,
  CreateEventInput,
  UpdateEventInput,
} from '@minton/types';
import { listAttendanceByEvent, summarize } from './attendance';
import { ulid } from '../lib/id';

/** DB の events 行 (recurrence は JSON 文字列で格納) */
interface EventRow {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  note: string | null;
  status: Event['status'];
  recurrence: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEvent(row: EventRow): Event {
  return {
    ...row,
    note: row.note ?? null,
    recurrence: row.recurrence ? JSON.parse(row.recurrence) : null,
  };
}

const emptySummary = (): AttendanceSummary => ({
  present: 0,
  partial: 0,
  leave_early: 0,
  absent: 0,
  no_response: 0,
});

/** イベント一覧 + 各イベントの出欠集計バッジ */
export async function listEvents(db: D1Database): Promise<EventListItem[]> {
  const [eventsRes, countRes, totalRes] = await db.batch<unknown>([
    db.prepare('SELECT * FROM events ORDER BY date DESC, start_time DESC'),
    db.prepare('SELECT event_id, status, COUNT(*) AS n FROM attendance GROUP BY event_id, status'),
    db.prepare('SELECT COUNT(*) AS total FROM members'),
  ]);

  const events = (eventsRes.results as EventRow[]).map(rowToEvent);
  const counts = countRes.results as { event_id: string; status: AttendanceStatus; n: number }[];
  const totalMembers = (totalRes.results as { total: number }[])[0]?.total ?? 0;

  const summaryByEvent = new Map<string, AttendanceSummary>();
  for (const { event_id, status, n } of counts) {
    const s = summaryByEvent.get(event_id) ?? emptySummary();
    s[status] = n;
    summaryByEvent.set(event_id, s);
  }

  return events.map((event) => {
    const summary = summaryByEvent.get(event.id) ?? emptySummary();
    const answered = summary.present + summary.partial + summary.leave_early + summary.absent;
    summary.no_response = Math.max(0, totalMembers - answered);
    return { ...event, summary };
  });
}

export async function getEvent(db: D1Database, id: string): Promise<Event | null> {
  const row = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first<EventRow>();
  return row ? rowToEvent(row) : null;
}

/** イベント詳細 + 出欠一覧 + 集計 */
export async function getEventDetail(
  db: D1Database,
  id: string,
): Promise<EventDetail | null> {
  const event = await getEvent(db, id);
  if (!event) return null;
  const attendance = await listAttendanceByEvent(db, id);
  return { ...event, attendance, summary: summarize(attendance) };
}

export async function createEvent(
  db: D1Database,
  input: CreateEventInput,
): Promise<Event> {
  const now = new Date().toISOString();
  const event: Event = {
    id: ulid(),
    title: input.title,
    date: input.date,
    start_time: input.start_time,
    end_time: input.end_time,
    location: input.location,
    note: input.note ?? null,
    status: input.status ?? 'draft',
    recurrence: input.recurrence ?? null,
    created_at: now,
    updated_at: now,
  };
  await db
    .prepare(
      `INSERT INTO events
         (id, title, date, start_time, end_time, location, note, status, recurrence, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      event.id,
      event.title,
      event.date,
      event.start_time,
      event.end_time,
      event.location,
      event.note,
      event.status,
      event.recurrence ? JSON.stringify(event.recurrence) : null,
      event.created_at,
      event.updated_at,
    )
    .run();
  return event;
}

export async function updateEvent(
  db: D1Database,
  id: string,
  input: UpdateEventInput,
): Promise<Event | null> {
  const current = await getEvent(db, id);
  if (!current) return null;

  const next: Event = {
    ...current,
    ...input,
    note: input.note !== undefined ? (input.note ?? null) : current.note,
    recurrence:
      input.recurrence !== undefined ? (input.recurrence ?? null) : current.recurrence,
    updated_at: new Date().toISOString(),
  };
  await db
    .prepare(
      `UPDATE events SET
         title = ?, date = ?, start_time = ?, end_time = ?, location = ?,
         note = ?, status = ?, recurrence = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      next.title,
      next.date,
      next.start_time,
      next.end_time,
      next.location,
      next.note,
      next.status,
      next.recurrence ? JSON.stringify(next.recurrence) : null,
      next.updated_at,
      id,
    )
    .run();
  return next;
}

export async function deleteEvent(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
  return (result.meta.changes ?? 0) > 0;
}

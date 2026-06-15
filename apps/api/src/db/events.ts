import { count, desc, eq } from 'drizzle-orm';
import type {
  Event,
  EventDetail,
  EventListItem,
  AttendanceSummary,
  CreateEventInput,
  UpdateEventInput,
} from '@minton/types';
import { getDb } from './client';
import { events, attendance, members } from './schema';
import { listAttendanceByEvent, summarize } from './attendance';
import { ulid } from '../lib/id';
import { expandRecurrence } from '../lib/date';

type EventRow = typeof events.$inferSelect;

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

function buildEvent(input: CreateEventInput, date: string, now: string): Event {
  return {
    id: ulid(),
    title: input.title,
    date,
    start_time: input.start_time,
    end_time: input.end_time,
    location: input.location,
    note: input.note ?? null,
    status: input.status ?? 'draft',
    recurrence: input.recurrence ?? null,
    visitor_count: input.visitor_count ?? 0,
    created_at: now,
    updated_at: now,
  };
}

/** events 行へ変換 (recurrence は JSON 文字列で保存) */
function toRow(e: Event): EventRow {
  return { ...e, recurrence: e.recurrence ? JSON.stringify(e.recurrence) : null };
}

/** イベント一覧 + 各イベントの出欠集計バッジ */
export async function listEvents(d1: D1Database): Promise<EventListItem[]> {
  const db = getDb(d1);
  const [eventRows, countRows, totalRows] = await Promise.all([
    db.select().from(events).orderBy(desc(events.date), desc(events.start_time)),
    db
      .select({
        event_id: attendance.event_id,
        status: attendance.status,
        n: count(),
      })
      .from(attendance)
      .groupBy(attendance.event_id, attendance.status),
    db.select({ total: count() }).from(members),
  ]);

  const totalMembers = totalRows[0]?.total ?? 0;

  const summaryByEvent = new Map<string, AttendanceSummary>();
  for (const { event_id, status, n } of countRows) {
    const s = summaryByEvent.get(event_id) ?? emptySummary();
    s[status] = n;
    summaryByEvent.set(event_id, s);
  }

  return eventRows.map((row) => {
    const event = rowToEvent(row);
    const summary = summaryByEvent.get(event.id) ?? emptySummary();
    const answered =
      summary.present + summary.partial + summary.leave_early + summary.absent;
    summary.no_response = Math.max(0, totalMembers - answered);
    return { ...event, summary };
  });
}

export async function getEvent(d1: D1Database, id: string): Promise<Event | null> {
  const rows = await getDb(d1).select().from(events).where(eq(events.id, id)).limit(1);
  return rows[0] ? rowToEvent(rows[0]) : null;
}

/** イベント詳細 + 出欠一覧 + 集計 */
export async function getEventDetail(
  d1: D1Database,
  id: string,
): Promise<EventDetail | null> {
  const event = await getEvent(d1, id);
  if (!event) return null;
  const att = await listAttendanceByEvent(d1, id);
  return { ...event, attendance: att, summary: summarize(att) };
}

/**
 * イベントを作成する。recurrence 指定時は until までの開催日に複製し一括 INSERT。
 * 戻り値は作成したイベント (日付昇順)。単発でも長さ 1 の配列。
 */
export async function createEvents(
  d1: D1Database,
  input: CreateEventInput,
): Promise<Event[]> {
  const now = new Date().toISOString();
  const dates = input.recurrence
    ? expandRecurrence(input.date, input.recurrence)
    : [input.date];
  const evts = dates.map((date) => buildEvent(input, date, now));
  await getDb(d1).insert(events).values(evts.map(toRow));
  return evts;
}

export async function updateEvent(
  d1: D1Database,
  id: string,
  input: UpdateEventInput,
): Promise<Event | null> {
  const current = await getEvent(d1, id);
  if (!current) return null;

  const next: Event = {
    ...current,
    ...input,
    note: input.note !== undefined ? (input.note ?? null) : current.note,
    recurrence:
      input.recurrence !== undefined ? (input.recurrence ?? null) : current.recurrence,
    updated_at: new Date().toISOString(),
  };
  await getDb(d1)
    .update(events)
    .set({
      title: next.title,
      date: next.date,
      start_time: next.start_time,
      end_time: next.end_time,
      location: next.location,
      note: next.note,
      status: next.status,
      recurrence: next.recurrence ? JSON.stringify(next.recurrence) : null,
      visitor_count: next.visitor_count,
      updated_at: next.updated_at,
    })
    .where(eq(events.id, id));
  return next;
}

export async function deleteEvent(d1: D1Database, id: string): Promise<boolean> {
  const res = await getDb(d1).delete(events).where(eq(events.id, id));
  return (res.meta.changes ?? 0) > 0;
}

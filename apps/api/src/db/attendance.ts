import { and, eq } from 'drizzle-orm';
import { getDb } from './client';
import { attendance, members } from './schema';
import type {
  Attendance,
  AttendanceEntry,
  AttendanceSummary,
  UpsertAttendanceInput,
} from '@minton/types';

/**
 * イベントの出欠一覧を取得する。
 * 全メンバーを基準に LEFT JOIN し、未回答メンバーは status=null で返す。
 */
export async function listAttendanceByEvent(
  d1: D1Database,
  eventId: string,
): Promise<AttendanceEntry[]> {
  return getDb(d1)
    .select({
      member_id: members.id,
      member_name: members.name,
      member_role: members.role,
      status: attendance.status,
      updated_at: attendance.updated_at,
    })
    .from(members)
    .leftJoin(
      attendance,
      and(eq(attendance.member_id, members.id), eq(attendance.event_id, eventId)),
    )
    .orderBy(members.created_at);
}

/** 出欠一覧からステータス別の集計を作る */
export function summarize(entries: AttendanceEntry[]): AttendanceSummary {
  const summary: AttendanceSummary = {
    present: 0,
    partial: 0,
    leave_early: 0,
    absent: 0,
    no_response: 0,
  };
  for (const entry of entries) {
    if (entry.status === null) summary.no_response += 1;
    else summary[entry.status] += 1;
  }
  return summary;
}

/** 出欠を upsert する (主キー衝突時は更新) */
export async function upsertAttendance(
  d1: D1Database,
  input: UpsertAttendanceInput,
): Promise<Attendance> {
  const record: Attendance = {
    event_id: input.event_id,
    member_id: input.member_id,
    status: input.status,
    updated_at: new Date().toISOString(),
  };
  await getDb(d1)
    .insert(attendance)
    .values(record)
    .onConflictDoUpdate({
      target: [attendance.event_id, attendance.member_id],
      set: { status: record.status, updated_at: record.updated_at },
    });
  return record;
}

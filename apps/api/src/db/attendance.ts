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
  db: D1Database,
  eventId: string,
): Promise<AttendanceEntry[]> {
  const { results } = await db
    .prepare(
      `SELECT m.id   AS member_id,
              m.name AS member_name,
              a.status     AS status,
              a.updated_at AS updated_at
         FROM members m
         LEFT JOIN attendance a
           ON a.member_id = m.id AND a.event_id = ?
        ORDER BY m.created_at ASC`,
    )
    .bind(eventId)
    .all<AttendanceEntry>();
  return results;
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

/** 出欠を upsert する (INSERT OR REPLACE) */
export async function upsertAttendance(
  db: D1Database,
  input: UpsertAttendanceInput,
): Promise<Attendance> {
  const record: Attendance = {
    event_id: input.event_id,
    member_id: input.member_id,
    status: input.status,
    updated_at: new Date().toISOString(),
  };
  await db
    .prepare(
      `INSERT INTO attendance (event_id, member_id, status, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (event_id, member_id)
       DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
    )
    .bind(record.event_id, record.member_id, record.status, record.updated_at)
    .run();
  return record;
}

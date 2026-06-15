import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const TIME_RE = /^\d{2}:\d{2}$/; // HH:MM

export const eventStatusSchema = z.enum(['draft', 'open', 'closed']);
export const memberRoleSchema = z.enum(['admin', 'member']);
export const attendanceStatusSchema = z.enum([
  'present',
  'partial',
  'leave_early',
  'absent',
]);

export const recurrenceSchema = z.object({
  type: z.enum(['weekly', 'biweekly', 'monthly']),
  until: z.string().regex(DATE_RE, 'until は YYYY-MM-DD 形式で指定してください'),
});

// --- events ---------------------------------------------------------------

export const createEventSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  date: z.string().regex(DATE_RE, '日付は YYYY-MM-DD 形式で指定してください'),
  start_time: z.string().regex(TIME_RE, '開始時刻は HH:MM 形式で指定してください'),
  end_time: z.string().regex(TIME_RE, '終了時刻は HH:MM 形式で指定してください'),
  location: z.string().min(1, '場所は必須です'),
  note: z.string().nullish(),
  status: eventStatusSchema.optional(),
  recurrence: recurrenceSchema.nullish(),
  visitor_count: z.number().int().min(0).optional(),
});

export const updateEventSchema = createEventSchema.partial();

// --- members --------------------------------------------------------------

export const createMemberSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  role: memberRoleSchema.optional(),
  email: z.string().email('メールアドレスの形式が不正です').nullish(),
});

export const updateMemberSchema = createMemberSchema.partial();

// --- attendance -----------------------------------------------------------

export const upsertAttendanceSchema = z.object({
  event_id: z.string().min(1),
  member_id: z.string().min(1),
  status: attendanceStatusSchema,
});

// --- auth -----------------------------------------------------------------

export const requestOtpSchema = z.object({
  email: z.string().email('メールアドレスの形式が不正です'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, '6桁の数字コードを入力してください'),
});

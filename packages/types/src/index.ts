/**
 * BadSync 共通型定義
 *
 * フロントエンド (apps/web) とバックエンド (apps/api) で共有する型を集約する。
 * DB スキーマ・API エンドポイント仕様は .claude/spec/spec.md を参照。
 */

// zod バリデーションスキーマ (フロント・バック共有)
export * from './schemas';

// ---------------------------------------------------------------------------
// 列挙的な値
// ---------------------------------------------------------------------------

/**
 * イベントの公開ステータス
 * - draft:  下書き
 * - open:   受付中
 * - full:   募集締切 (admin が手動で締切)
 * - closed: 終了
 */
export type EventStatus = 'draft' | 'open' | 'full' | 'closed';

/** メンバーのロール */
export type MemberRole = 'admin' | 'member';

/**
 * 出欠ステータス
 * - present:     ○ 参加
 * - partial:     □ 途中参加
 * - leave_early: △ 早退
 * - absent:      ×  不参加
 */
export type AttendanceStatus = 'present' | 'partial' | 'leave_early' | 'absent';

/** 定期開催設定 (events.recurrence に JSON 文字列として保存) */
export interface Recurrence {
  type: 'weekly' | 'biweekly' | 'monthly';
  /** 繰り返しの終了日 (YYYY-MM-DD) */
  until: string;
}

// ---------------------------------------------------------------------------
// エンティティ
// ---------------------------------------------------------------------------

export interface Event {
  /** ULID */
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  start_time: string;
  /** HH:MM */
  end_time: string;
  location: string;
  note: string | null;
  status: EventStatus;
  /** 定期開催設定。単発イベントは null */
  recurrence: Recurrence | null;
  /** ビジター（メンバー外参加者）の人数。admin が任意で設定 */
  visitor_count: number;
  /** ISO 8601 */
  created_at: string;
  /** ISO 8601 */
  updated_at: string;
}

export interface Member {
  /** ULID */
  id: string;
  name: string;
  role: MemberRole;
  /** ログイン用メールアドレス (v2 認証)。未招待は null */
  email: string | null;
  /** ISO 8601 */
  created_at: string;
}

export interface Attendance {
  event_id: string;
  member_id: string;
  status: AttendanceStatus;
  /** ISO 8601 */
  updated_at: string;
}

// ---------------------------------------------------------------------------
// 集計・複合ビュー
// ---------------------------------------------------------------------------

/** イベントカードに表示する出欠集計バッジ (○n / □n / △n / ×n) */
export interface AttendanceSummary {
  present: number;
  partial: number;
  leave_early: number;
  absent: number;
  /** 未回答 (メンバー総数 - 回答数) */
  no_response: number;
}

/** 出欠一覧の 1 行 (メンバー名 + そのイベントでの回答) */
export interface AttendanceEntry {
  member_id: string;
  member_name: string;
  member_role: MemberRole;
  /** 未回答は null */
  status: AttendanceStatus | null;
  updated_at: string | null;
}

/** イベント詳細 (GET /api/events/:id) のレスポンス */
export interface EventDetail extends Event {
  summary: AttendanceSummary;
  attendance: AttendanceEntry[];
}

/** イベント一覧 (GET /api/events) の各要素 */
export interface EventListItem extends Event {
  summary: AttendanceSummary;
}

// ---------------------------------------------------------------------------
// API リクエスト入力
// ---------------------------------------------------------------------------

export interface CreateEventInput {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  note?: string | null;
  status?: EventStatus;
  recurrence?: Recurrence | null;
  visitor_count?: number;
}

/** イベント更新 (PUT /api/events/:id)。指定したフィールドのみ更新 */
export type UpdateEventInput = Partial<CreateEventInput>;

/** イベント作成テンプレート（「木曜練習」など日付以外の雛形） */
export interface EventTemplate {
  id: string;
  /** テンプレ名 = イベントタイトル雛形 */
  name: string;
  start_time: string;
  end_time: string;
  location: string;
  note: string | null;
  /** 開催曜日 (0=日 .. 6=土)。未設定は null */
  weekday: number | null;
  created_at: string;
}

export interface CreateTemplateInput {
  name: string;
  start_time: string;
  end_time: string;
  location: string;
  note?: string | null;
  weekday?: number | null;
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;

export interface CreateMemberInput {
  name: string;
  role?: MemberRole;
  email?: string | null;
}

export type UpdateMemberInput = Partial<CreateMemberInput>;

/** 出欠更新 (PUT /api/attendance)。upsert */
export interface UpsertAttendanceInput {
  event_id: string;
  member_id: string;
  status: AttendanceStatus;
}

// ---------------------------------------------------------------------------
// 集金 (料金設定)
// ---------------------------------------------------------------------------

/** サークル全体で共通の料金設定（出欠ステータス別の単価） */
export interface FeeSettings {
  fee_present: number;
  fee_partial: number;
  fee_leave_early: number;
  fee_visitor: number;
}

export type UpdateFeeSettingsInput = FeeSettings;

// ---------------------------------------------------------------------------
// 認証 (v2)
// ---------------------------------------------------------------------------

/** OTP 送信リクエスト (POST /api/auth/request) */
export interface RequestOtpInput {
  email: string;
}

/** OTP 検証リクエスト (POST /api/auth/verify) */
export interface VerifyOtpInput {
  email: string;
  code: string;
}

// ---------------------------------------------------------------------------
// 汎用 API レスポンス
// ---------------------------------------------------------------------------

export interface ApiError {
  error: string;
  /** バリデーションエラー等の詳細 (任意) */
  details?: unknown;
}

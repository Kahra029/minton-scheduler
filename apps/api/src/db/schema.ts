import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// 既存スキーマ (migrations/0001, 0002) に一致させた Drizzle 定義。
// マイグレーションは wrangler d1 migrations で管理し、drizzle-kit は使わない。
// プロパティ名は @minton/types に揃えて snake_case にしている。

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    date: text('date').notNull(),
    start_time: text('start_time').notNull(),
    end_time: text('end_time').notNull(),
    location: text('location').notNull(),
    note: text('note'),
    status: text('status', { enum: ['draft', 'open', 'closed'] })
      .notNull()
      .default('draft'),
    recurrence: text('recurrence'), // JSON 文字列
    visitor_count: integer('visitor_count').notNull().default(0),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (t) => [index('idx_events_date').on(t.date), index('idx_events_status').on(t.status)],
);

export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    role: text('role', { enum: ['admin', 'member'] })
      .notNull()
      .default('member'),
    email: text('email'),
    created_at: text('created_at').notNull(),
  },
  (t) => [uniqueIndex('idx_members_email').on(t.email)],
);

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  fee_present: integer('fee_present').notNull().default(0),
  fee_partial: integer('fee_partial').notNull().default(0),
  fee_leave_early: integer('fee_leave_early').notNull().default(0),
  fee_visitor: integer('fee_visitor').notNull().default(0),
  updated_at: text('updated_at').notNull(),
});

export const eventTemplates = sqliteTable('event_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  start_time: text('start_time').notNull(),
  end_time: text('end_time').notNull(),
  location: text('location').notNull(),
  note: text('note'),
  created_at: text('created_at').notNull(),
});

export const attendance = sqliteTable(
  'attendance',
  {
    event_id: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    member_id: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['present', 'partial', 'leave_early', 'absent'],
    }).notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.event_id, t.member_id] }),
    index('idx_attendance_member').on(t.member_id),
  ],
);

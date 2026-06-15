-- BadSync 初期スキーマ
-- 詳細は .claude/spec/spec.md 4.2 DB スキーマ を参照

-- イベント（練習日・場所）
CREATE TABLE events (
  id          TEXT PRIMARY KEY,               -- ULID
  title       TEXT NOT NULL,
  date        TEXT NOT NULL,                  -- YYYY-MM-DD
  start_time  TEXT NOT NULL,                  -- HH:MM
  end_time    TEXT NOT NULL,                  -- HH:MM
  location    TEXT NOT NULL,
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'open' | 'closed'
  recurrence  TEXT,                           -- JSON 文字列（任意）
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- 一覧は日付順に並べることが多いので複合インデックスを用意
CREATE INDEX idx_events_date ON events (date);
CREATE INDEX idx_events_status ON events (status);

-- メンバー
CREATE TABLE members (
  id         TEXT PRIMARY KEY,                -- ULID
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'member',  -- 'admin' | 'member'
  created_at TEXT NOT NULL
);

-- 出欠（イベント × メンバーで一意。upsert で更新）
CREATE TABLE attendance (
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id  TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,                   -- 'present' | 'partial' | 'leave_early' | 'absent'
  updated_at TEXT NOT NULL,
  PRIMARY KEY (event_id, member_id)
);

-- イベント別の出欠一覧取得を高速化
CREATE INDEX idx_attendance_member ON attendance (member_id);

-- イベント作成テンプレート（「木曜練習」など、日付以外の雛形を保持）
CREATE TABLE event_templates (
  id         TEXT PRIMARY KEY,        -- ULID
  name       TEXT NOT NULL,           -- テンプレ名 = イベントタイトル雛形「木曜練習」
  start_time TEXT NOT NULL,           -- HH:MM
  end_time   TEXT NOT NULL,           -- HH:MM
  location   TEXT NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL
);

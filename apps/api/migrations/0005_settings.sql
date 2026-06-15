-- 集金用の料金設定（サークル全体で共通の単価。単一行 id=1 で管理）
CREATE TABLE settings (
  id              INTEGER PRIMARY KEY,
  fee_present     INTEGER NOT NULL DEFAULT 0,  -- 参加
  fee_partial     INTEGER NOT NULL DEFAULT 0,  -- 途中参加（遅刻）
  fee_leave_early INTEGER NOT NULL DEFAULT 0,  -- 早退
  fee_visitor     INTEGER NOT NULL DEFAULT 0,  -- ビジター専用単価
  updated_at      TEXT NOT NULL
);

INSERT INTO settings (id, fee_present, fee_partial, fee_leave_early, fee_visitor, updated_at)
VALUES (1, 0, 0, 0, 0, '2026-06-15T00:00:00.000Z');

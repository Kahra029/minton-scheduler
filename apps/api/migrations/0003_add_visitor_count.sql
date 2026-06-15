-- ビジター（メンバー外の参加者）人数。admin がイベントごとに増減する。
ALTER TABLE events ADD COLUMN visitor_count INTEGER NOT NULL DEFAULT 0;

-- テンプレートの開催曜日 (0=日 .. 6=土)。任意 (未設定は NULL)
ALTER TABLE event_templates ADD COLUMN weekday INTEGER;

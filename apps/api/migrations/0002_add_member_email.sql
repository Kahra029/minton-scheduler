-- メンバーにログイン用メールアドレスを追加 (v2 認証)
-- email は招待時に admin が登録するログインのキー。
-- 既存メンバーは NULL のまま（SQLite の UNIQUE は複数 NULL を許容する）。
ALTER TABLE members ADD COLUMN email TEXT;
CREATE UNIQUE INDEX idx_members_email ON members (email);

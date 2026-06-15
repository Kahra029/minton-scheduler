# BadSync 認証設計 (v2)

## ねらい

v1 の `X-Admin-Token` による簡易保護を廃し、**メール OTP（ワンタイムコード）によるパスワードレス認証**と**ロール別アクセス制御**を導入する。サークル（クローズド）向けに**招待制**とする。

メール送信は **Cloudflare Email Service（Workers の `send_email` binding）** を使い、スタックを Cloudflare 完結とする。独自ドメイン未取得の現段階は **dev モード（OTP をサーバログに出力、実送信しない）** で実装を進め、ドメイン取得（Phase 6）後に実送信へ切り替える。

---

## 1. 認証方式：メール OTP（パスワードレス）

```
1. /login でメールアドレスを入力
2. POST /api/auth/request { email }
   - members に該当 email があれば 6桁コードを生成し送信（dev はログ出力）
   - 該当が無くてもレスポンスは同一（ユーザー列挙を防ぐ）
3. /login でコードを入力
4. POST /api/auth/verify { email, code }
   - コード照合 → 成功なら JWT を発行し httpOnly Cookie にセット
5. 以降は Cookie の JWT で認証
```

- パスワードは持たない（ハッシュ・リセットフロー不要）。
- 初回ログイン＝アカウント有効化（招待制のため事前に admin が member 登録済み）。

---

## 2. データモデル

### members テーブル拡張（マイグレーション 0002）

```sql
ALTER TABLE members ADD COLUMN email TEXT;
CREATE UNIQUE INDEX idx_members_email ON members (email);
```

- `email` は招待時に admin が登録（ログインのキー）。
- v1 既存メンバーは email 未設定 → ログイン不可（admin が後から付与）。

### OTP の保存：Cloudflare KV

OTP は短命なので TTL を持つ KV が最適。

```
KV namespace: OTP
  key:   otp:<email>
  value: { codeHash, memberId, attempts }
  expirationTtl: 600   // 10分で自動失効
```

- コードは平文保存せず **SHA-256 ハッシュ**で保存。
- 検証成功・試行上限超過で削除。
- レート制限用に `cooldown:<email>`（TTL 60秒）も併用。

---

## 3. JWT / セッション

- ライブラリ：`hono/jwt`（HS256）。secret は `wrangler secret put JWT_SECRET`。
- ペイロード：`{ sub: member_id, role, name, exp }`
- 保存：**httpOnly + Secure + SameSite=Lax の Cookie**（Workers と Pages を同一ドメインで配信し CORS を回避）。
  - localStorage は XSS リスクのため不採用。
- 有効期限：30日。リフレッシュトークンは初版では省略し、期限切れは再ログイン。

---

## 4. メール送信（Cloudflare Email Service）

- `lib/mail.ts` に `sendOtpEmail(email, code)` を実装し、送信手段を隠蔽する。
- **本番**：`send_email` binding でメール送信（wrangler.jsonc に binding 追加）。
  - 任意の受信者へ送るには**送信ドメインのオンボード（独自ドメイン＋DNS/DKIM）が前提** → Phase 6 と連動。
- **dev / ドメイン未取得**：binding が無い場合は OTP を `console.log` に出力（実送信しない）。
  - 環境判定：`c.env.SEB`（send_email binding）の有無で分岐。
- 切り替えはコード変更なし（binding の有無のみ）で完了する設計とする。

```ts
// 擬似コード
export async function sendOtpEmail(env, email, code) {
  if (!env.SEB) { console.log(`[DEV OTP] ${email} -> ${code}`); return }
  // send_email binding で MIME メールを送信
}
```

---

## 5. API エンドポイント（追加）

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| `POST` | `/api/auth/request` | メールに OTP 送信（常に 200） | 不要 |
| `POST` | `/api/auth/verify` | OTP 検証 → JWT Cookie 発行 | 不要 |
| `POST` | `/api/auth/logout` | Cookie 削除 | 要 |
| `GET`  | `/api/auth/me` | 現在のログイン member を返す | 要 |

### 既存エンドポイントの保護更新

- `adminAuth`（X-Admin-Token）→ `requireAuth` / `requireAdmin`（JWT）に置換。
- 出欠更新 `PUT /api/attendance`：**ログイン本人の出欠のみ**更新可。admin は全員分を更新可（spec 2.2.3）。
  - リクエストの member_id がトークンの sub と一致、または role=admin を要求。

---

## 6. ミドルウェア

```
requireAuth:  Cookie の JWT を検証 → c.set('member', payload)。無効なら 401。
requireAdmin: requireAuth + role==='admin' を要求。違えば 403。
```

---

## 7. フロントエンド

- `/login` ページ：メール入力 → コード入力の 2 ステップ。
- 認証状態は `AuthProvider`（Context）で保持。起動時 `GET /api/auth/me` で復元。
- v1 の `AdminTokenField` / localStorage トークン / `AdminGate` を撤去し、
  - 未ログイン → ログインを促す
  - ログイン済み & role=admin → 管理機能（作成/編集/メンバー管理）を表示
- メンバー追加フォーム（`MemberForm`）に **email 入力**を追加（招待のため）。

---

## 8. セキュリティ

- OTP：6桁、TTL 10分、試行上限 5回、使用後即削除。
- レート制限：同一メールへの request 連打を KV の cooldown キーで抑制（60秒）。
- ユーザー列挙防止：request は存在有無に関わらず同一レスポンス。
- JWT secret は Workers Secret で管理（リポジトリに含めない）。

---

## 9. 実装フェーズ案（ドメイン非依存で進められる順）

1. **DB**：members に email 追加（migration 0002 / local + remote 適用）
2. **KV**：OTP namespace 作成・binding 追加（local は自動）
3. **メール基盤**：`lib/mail.ts`（dev はログ出力）、JWT secret の dev 設定（.dev.vars）
4. **バック認証**：`/api/auth/*`、JWT 発行/検証、`requireAuth`/`requireAdmin`、既存ルート保護を置換
5. **出欠の本人/admin 認可**：`PUT /api/attendance`
6. **フロント**：`/login`、`AuthProvider`、admin トークン UI 撤去、MemberForm に email
7. **E2E**：OTP 発行（ログ確認）→ verify → Cookie → admin 操作
8. **（Phase 6）**：独自ドメイン取得・送信ドメインオンボード → `send_email` binding 有効化で実送信へ

---

## 10. 確定事項

| 論点 | 決定 |
|------|------|
| 認証方式 | メール OTP（パスワードレス） |
| 登録フロー | 招待制（admin が email 付きで member 登録） |
| メール送信 | Cloudflare Email Service（`send_email` binding）。dev はログ出力 |
| OTP 保存 | Cloudflare KV（TTL 自動失効） |
| JWT 保存 | httpOnly Cookie（Workers+Pages 同一ドメイン配信前提） |
| 出欠編集権限 | 本人のみ（admin は全員可） |
| 既存 X-Admin-Token | 廃止し JWT へ移行 |
| 実送信の有効化 | Phase 6（ドメイン取得・オンボード）後 |

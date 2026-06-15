# BadSync — バドミントンサークル出欠管理アプリ
## 要求要件書・設計書 v1.0

---

## 1. プロジェクト概要

### 1.1 目的

バドミントンサークルのイベント出欠確認をスマートフォンで快適に行える Web アプリを構築する。管理コストを最小化しつつ、メンバー全員が直感的に参加可否を入力・確認できる環境を提供する。

### 1.2 スコープ（v1）

- イベント（練習日・場所）の作成・管理
- メンバーの出欠入力（○参加 / □途中参加 / △早退 / ×不参加）
- 出欠一覧のリアルタイム確認
- ロール管理（admin / member）
- スマートフォンファーストの UI

### 1.3 スコープ外（v1）

- ログイン・認証機能（v2 で追加予定）
- プッシュ通知・メール通知
- コート割り当て・マッチング
- 決済・会費管理

---

## 2. 要求要件

### 2.1 ユーザーロール

| ロール | 説明 | 主な権限 |
|--------|------|----------|
| `admin` | サークル幹事・管理者 | イベント CRUD、メンバー管理、全出欠の閲覧・編集 |
| `member` | 一般サークルメンバー | 自分の出欠入力・閲覧、イベント閲覧（作成不可） |

### 2.2 機能要件

#### 2.2.1 認証・権限

- v1 は URL 共有によるアクセス（ログイン機能なし）
- admin 操作は `X-Admin-Token` ヘッダーによる簡易保護（v1）
- v2 以降で JWT 認証・ロール別アクセス制御を追加予定

#### 2.2.2 イベント管理（admin のみ）

- イベントの作成：タイトル・日付・開始/終了時刻・場所・メモを登録
- イベントの編集・削除
- 定期開催設定：毎週 / 隔週 / 月1回 / カスタムで自動複製
- ステータス管理：`draft`（下書き） / `open`（受付中） / `closed`（締切済み）

#### 2.2.3 出欠入力（全ロール）

- 4択ボタンで出欠を入力：○参加 / □途中参加 / △早退 / ×不参加
- 未回答は空欄で表示
- 入力は即時保存（サーバーへ PUT、楽観的更新）
- 同一イベントへの複数回入力は上書き（upsert）

#### 2.2.4 出欠一覧表示

- イベントカードに参加ステータスの集計バッジを表示（○n / □n / △n / ×n）
- メンバーリストをカード内に展開表示（最大 100 名）
- 「残り N 件を表示」の遅延ロード対応

#### 2.2.5 メンバー管理（admin のみ）

- メンバーの追加・編集・削除
- メンバー一覧・ロール確認

### 2.3 非機能要件

| 項目 | 要件 |
|------|------|
| 対応デバイス | スマートフォン優先（iOS Safari / Android Chrome）、PC 対応 |
| レスポンス | 出欠更新 PUT < 500ms（P95） |
| 可用性 | 99% 以上（Cloudflare Workers SLA に依存） |
| スケール | メンバー 100 名以下・週 1〜3 イベントを想定 |
| コスト | 月額ほぼ $0（Cloudflare 無料枠内での運用） |
| セキュリティ | v1 は簡易トークン保護、v2 で JWT 認証導入予定 |

---

## 3. 技術スタック

| レイヤー | 技術 | 理由 |
|----------|------|------|
| フロントエンド | React + TypeScript (Vite) | 型安全・エコシステム充実 |
| UI コンポーネント | shadcn/ui + Tailwind CSS | カスタマイズ性・保守性 |
| バックエンド | Hono (TypeScript) | Go ライクな DX・Workers 対応・型共有 |
| データベース | Cloudflare D1 (SQLite 互換) | 無料・サーバーレス・Workers と同リージョン |
| ホスティング | Cloudflare Workers + Pages | 無料枠・CDN・ゼロコールドスタート |
| ドメイン | Cloudflare Registrar | 年間約 $10・DNS 統合 |
| 型共有 | 共通 `types` パッケージ（monorepo） | フロント/バックの型ずれ防止 |

---

## 4. システム設計

### 4.1 アーキテクチャ

```
[ ブラウザ (React/Vite) ]
        |  HTTPS REST API
        v
[ Cloudflare Workers (Hono) ]  <-- Cloudflare Pages が React SPA を配信
        |  D1 binding
        v
[ Cloudflare D1 (SQLite) ]
```

### 4.2 DB スキーマ

#### events

```sql
CREATE TABLE events (
  id          TEXT PRIMARY KEY,        -- ULID
  title       TEXT NOT NULL,
  date        TEXT NOT NULL,           -- YYYY-MM-DD
  start_time  TEXT NOT NULL,           -- HH:MM
  end_time    TEXT NOT NULL,           -- HH:MM
  location    TEXT NOT NULL,
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'open' | 'closed'
  recurrence  TEXT,                    -- JSON (任意)
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

#### members

```sql
CREATE TABLE members (
  id         TEXT PRIMARY KEY,         -- ULID
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'member',  -- 'admin' | 'member'
  created_at TEXT NOT NULL
);
```

#### attendance

```sql
CREATE TABLE attendance (
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id  TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,  -- 'present' | 'partial' | 'leave_early' | 'absent'
  updated_at TEXT NOT NULL,
  PRIMARY KEY (event_id, member_id)
);
```

### 4.3 API エンドポイント

| メソッド | パス | 説明 | ロール |
|----------|------|------|--------|
| `GET` | `/api/events` | イベント一覧取得 | 全員 |
| `POST` | `/api/events` | イベント作成 | admin |
| `GET` | `/api/events/:id` | イベント詳細 + 出欠一覧 | 全員 |
| `PUT` | `/api/events/:id` | イベント更新 | admin |
| `DELETE` | `/api/events/:id` | イベント削除 | admin |
| `GET` | `/api/members` | メンバー一覧 | 全員 |
| `POST` | `/api/members` | メンバー追加 | admin |
| `PUT` | `/api/members/:id` | メンバー更新 | admin |
| `DELETE` | `/api/members/:id` | メンバー削除 | admin |
| `PUT` | `/api/attendance` | 出欠更新（upsert） | 全員 |
| `GET` | `/api/events/:id/attendance` | イベント別出欠一覧 | 全員 |

---

## 5. プロジェクト構成

```
badsync/
  apps/
    web/                    # React + Vite フロントエンド
      src/
        components/
          ui/               # shadcn 自動生成コンポーネント
          events/           # イベント関連コンポーネント
          members/          # メンバー関連コンポーネント
        pages/              # ページコンポーネント
        hooks/              # カスタムフック
        lib/                # API クライアント・ユーティリティ
      index.html
      vite.config.ts
    api/                    # Hono バックエンド (Cloudflare Workers)
      src/
        routes/             # ルートハンドラ
        db/                 # D1 クエリ
        middleware/         # 認証・バリデーション
      wrangler.toml
  packages/
    types/                  # 共通型定義（フロント・バック共有）
      src/
        index.ts
  package.json              # ワークスペース設定 (npm workspaces)
```

---

## 6. 画面設計

### 6.1 画面一覧

| 画面名 | パス | 説明 | ロール |
|--------|------|------|--------|
| イベント一覧 | `/` | イベントカード一覧・出欠集計バッジ | 全員 |
| イベント詳細 | `/events/:id` | メンバー別出欠入力・集計 | 全員 |
| イベント作成 | `/events/new` | タイトル/日時/場所/繰り返し設定 | admin |
| イベント編集 | `/events/:id/edit` | イベント情報の変更 | admin |
| メンバー一覧 | `/members` | メンバー管理・ロール確認 | admin |
| メンバー追加 | `/members/new` | 名前・ロール登録 | admin |

### 6.2 主要 UI コンポーネント（shadcn/ui ベース）

| コンポーネント | shadcn パーツ | 役割 |
|----------------|--------------|------|
| `EventCard` | `Card` + `Collapsible` | イベントカード・展開/折りたたみ |
| `AttendanceRow` | `ToggleGroup` + `Toggle` | メンバー行 + 4択ボタン |
| `StatusBadge` | `Badge`（variant カスタム） | ○□△× 集計バッジ |
| `EventForm` | `Form` + `Calendar` + `Switch` | イベント作成/編集フォーム |
| `MemberCombobox` | `Command` | メンバー検索・選択 |

---

## 7. 開発ロードマップ

| フェーズ | 内容 | 優先度 |
|----------|------|--------|
| Phase 1 | Cloudflare 環境構築・D1 スキーマ適用・Hono 雛形 | 高 |
| Phase 2 | 出欠 API 実装（CRUD）・Zod バリデーション | 高 |
| Phase 3 | React フロント実装・shadcn/ui 導入・出欠入力 UI | 高 |
| Phase 4 | イベント作成フォーム・定期開催機能 | 高 |
| Phase 5 | メンバー管理 UI・admin ガード（暫定トークン） | 中 |
| Phase 6 | ドメイン設定・本番デプロイ | 中 |
| Phase 7（v2） | ログイン機能・JWT 認証・ロール別アクセス制御 | 低 |
| Phase 8（v2） | プッシュ通知・リマインダー | 低 |

---

## 8. コスト試算

| サービス | 無料枠 | 想定使用量 | 月額 |
|----------|--------|------------|------|
| Cloudflare Workers | 10 万リクエスト/日 | < 1 万/日 | $0 |
| Cloudflare D1 | 500 万行読み取り/日 | < 10 万/日 | $0 |
| Cloudflare Pages | 無制限 | 静的ホスティング | $0 |
| Cloudflare Registrar | — | ドメイン 1 件 | 約 $10/年 |

**合計：ほぼ $0（ドメイン代のみ年間約 $10）**

---

## 9. ClaudeCode への引き継ぎ事項

- 本ドキュメントに基づき Phase 1 から順に実装を進める
- 型定義は `packages/types` に集約し、フロント・バック双方から import する
- shadcn/ui は `npx shadcn@latest init` で初期化後、必要なコンポーネントを都度追加
- D1 マイグレーションは `wrangler d1 migrations apply` で管理
- v1 の admin 保護は `X-Admin-Token` ヘッダーによる簡易認証で実装し、v2 で JWT に移行
- 出欠 PUT は `INSERT OR REPLACE`（upsert）で実装し、楽観的更新をフロントで行う
- `recurrence` カラムは `{ type: 'weekly' | 'biweekly' | 'monthly', until: 'YYYY-MM-DD' }` の JSON を想定
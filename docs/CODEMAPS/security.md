<!-- Created: 2026-03-08 | Token estimate: ~900 -->
# Security Design

設計レベルのセキュリティ文書。QA チェックリストは [docs/checklists/security.md](../checklists/security.md) を参照。

## 認証アーキテクチャ

### 二層認証モデル

```
第1層: Supabase Auth (Email/Password)
  → @kindai.ac.jp ドメイン限定
  → JWT トークン発行
  → 全ユーザー共通

第2層: 管理者パスワード認証
  → verify-admin-password Edge Function
  → bcrypt ハッシュ比較 (compareSync)
  → セッション限り（DB 書き込みなし）
  → sessionStorage で権限保持（ブラウザタブ閉鎖で消失）
```

### JWT フロー

```
Frontend                  Supabase Auth                Edge Functions
   │                           │                           │
   │── signIn ────────────→    │                           │
   │←── JWT ──────────────    │                           │
   │                           │                           │
   │── Authorization: Bearer JWT ─────────────────────→   │
   │                           │    withAuth()              │
   │                           │←── getUser(JWT) ────     │
   │                           │──→ user object ────→     │
   │←── Response ─────────────────────────────────────    │
```

### withAuth ミドルウェア

全 Edge Function の統一認証ゲートウェイ:

- `Authorization` ヘッダーがなければ 401
- `supabase.auth.getUser(token)` で JWT 検証（Supabase Auth サーバーサイド検証）
- `useAnon: true` オプション: RLS が適用される Supabase クライアントで認証（review, verify-admin-password で使用）
- 未キャッチ例外は 500 レスポンスに変換

### --no-verify-jwt の理由

全 Edge Function を `--no-verify-jwt` でデプロイする理由:
- 全関数が内部で `supabase.auth.getUser()` を呼び出し、サーバーサイドで JWT を検証
- Supabase のリレーレベル JWT 検証（`verify_jwt: true`）は重複チェックとなり、`withAuth` の柔軟な認証パターン（`useAnon` 等）と競合する
- `--no-verify-jwt` はリレーの自動チェックを無効化するだけで、アプリケーションレベルの認証は維持

## 管理者権限モデル

### 3ロール構成

| ロール | screen 権限 | 審査範囲 | 設定管理 |
|--------|-----------|---------|---------|
| koho (広報部) | `josenai_review_koho` | koho 提出のみ | × |
| kikaku (企画管理部) | `josenai_review_kikaku` | kikaku 提出のみ | × |
| super (管理者) | `josenai_review_koho`, `josenai_review_kikaku`, `josenai_admin` | 全提出 | ○ |

### Screen-based RBAC

- ロール定義: `config/admin.json` (Single Source of Truth)
- フロントエンド: AdminContext が `screens` セットで画面表示制御
- バックエンド: `fn_is_josenai_koho()`, `fn_is_josenai_kikaku()`, `fn_is_josenai_admin()` RPC 関数
- Edge Function 内の権限チェック: `createUserClient(authHeader)` → RPC 呼び出し

### sessionStorage 永続化

- 認証成功時: `sessionStorage.setItem('josenai_admin_screens', JSON.stringify([...screens]))`
- リロード時: `sessionStorage.getItem()` → React state に復元
- セキュリティ: `sessionStorage` はタブスコープ（他タブや他ウィンドウから参照不可）

## RLS ポリシー設計

### テーブル × 操作 マトリクス

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| `josenai_profiles` | 本人のみ | 本人のみ | 本人のみ | - |
| `josenai_organizations` | 全員 | admin | admin | admin |
| `josenai_projects` | 全員 | admin | admin | admin |
| `josenai_submissions` | 本人 + 担当部署 + admin + 過去審査者 | 本人 | 担当部署 + admin | 本人 (pending のみ) |
| `josenai_media_specs` | 全員 | - | - | - |
| `josenai_check_items` | 全員 | - | - | - |
| `josenai_rule_documents` | 全員 | - | reviewer | - |
| `josenai_app_settings` | 全員 (PW系は reviewer+) | - | admin | - |

### submissions の SELECT ポリシー（最複雑）

```sql
-- 5つの OR 条件
user_id = auth.uid()                                           -- 提出者本人
OR (fn_is_josenai_koho() AND submission_type = 'koho')         -- 広報部
OR (fn_is_josenai_kikaku() AND submission_type = 'kikaku')     -- 企画管理部
OR fn_is_josenai_admin()                                       -- 管理者
OR reviewed_by = auth.uid()                                    -- 過去の審査者
```

## Edge Function セキュリティ

### supabaseAdmin vs supabaseAnon

| クライアント | 用途 | RLS |
|------------|------|-----|
| `supabaseAdmin` | DB 操作（INSERT, UPDATE, SELECT） | バイパス |
| `supabaseAnon` (via `createUserClient`) | RPC 権限チェック | 適用 |

- `supabaseAdmin`: サービスロールキーで RLS をバイパス。Edge Function 内のみで使用
- `createUserClient`: ユーザーの JWT を使用して RLS を適用。権限チェック RPC に使用

### 所有権チェック

- `delete-submission`: `drive_file_id` から submission を検索し、`user_id` が要求者と一致するか確認
- `review`: RPC (`fn_is_josenai_*`) で部署権限を検証
- `import-*` / `update-password`: `fn_is_josenai_admin` で管理者権限を検証

## 外部サービス認証

### Google Drive (サービスアカウント)

```
GOOGLE_DRIVE_SERVICE_ACCOUNT (JSON)
  → PEM 秘密鍵インポート (Web Crypto API)
  → RS256 JWT 生成 (iss=client_email, scope=drive.file)
  → POST oauth2.googleapis.com/token
  → アクセストークン取得
  → 5分間メモリキャッシュ、期限前に自動再取得
  → 401 応答時に 1 回再取得リトライ
```

- スコープ: `drive.file`（アプリが作成したファイルのみ操作可能 — 最小権限の原則）

### Gemini AI (API Key)

- `GEMINI_API_KEY` を Supabase Secrets に保存
- REST API 直接呼び出し（googleapis パッケージ未使用）
- フロントエンドには露出しない（Edge Function 経由のみ）

## パスワード管理

- ハッシュアルゴリズム: bcrypt (ソルト付き、コストファクター 10)
- 保存場所: `josenai_app_settings` テーブル
- 最小文字数: 8文字 (`config/admin.json` の `validation.minPasswordLength`)
- **Deno Deploy 制約**: `compareSync()` / `hashSync()` のみ使用（async は Web Worker を使用するため Deno Deploy でクラッシュ）

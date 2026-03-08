<!-- Updated: 2026-03-08 | Files scanned: 20 | Token estimate: ~1200 -->
# Backend (Edge Functions)

## 概要

**ランタイム**: Deno (Supabase Edge Functions) | **言語**: TypeScript
**パス**: `supabase/functions/`
**共通パターン**: 全関数が `withAuth()` ミドルウェアで CORS + JWT 認証を統一処理

## Edge Functions 一覧

### submit (最複雑)
**POST** `multipart/form-data` | ファイル提出 → AI 判定 → Drive アップロード → Docs レポート → DB 登録

8つのステップ関数に分離:
```
1. parseFormData()      — フォームデータのパース・バリデーション
2. fetchSettings()      — josenai_app_settings からアプリ設定取得
3. fetchOrgProject()    — 団体名・企画名を DB 取得
4. runAIAnalysis()      — Gemini AI 判定（タイムアウト付き）
5. uploadToDrive()      — Drive フォルダ確保 + ファイルアップロード + 共有URL取得
6. createDocsReport()   — AI判定レポート Google Docs 生成（失敗しても提出継続）
7. insertSubmission()   — DB INSERT（失敗時は Drive ファイルをロールバック削除）
8. tryAutoApprove()     — 自動承認判定（条件充足時に status='approved' へ UPDATE）
```

precheck モード (`precheck=true`): AI 判定のみ（Drive/DB/Docs 保存なし）

依存: `middleware`, `geminiClient`, `driveClient`, `docsClient`, `checkItems`, `retry`, `response`

### sandbox
**POST** `multipart/form-data` | AI 判定プレビュー (1日3回制限, DB 保存なし)
```
withAuth → 日次カウント確認 → checkItems 取得 → Gemini 判定 → カウント+1 → 結果返却
```
依存: `middleware`, `geminiClient`, `checkItems`, `retry`, `response`

### delete-submission
**POST** `application/json` | Drive ファイル削除 (ベストエフォート + 所有権チェック)
```
withAuth → 所有権チェック (user_id 照合) → Drive 削除
```
依存: `middleware`, `driveClient`, `response`

### verify-admin-password
**POST** `application/json` | 管理者パスワード検証 (セッション限り)
```
withAuth (useAnon) → role + password → app_settings からハッシュ取得 → bcrypt.compareSync()
→ { valid: true/false }
```
依存: `middleware`, `auth` (PASSWORD_KEYS), `response`, `bcrypt`

### update-password
**POST** `application/json` | 管理者パスワード変更
```
withAuth → 管理者権限チェック (fn_is_josenai_admin RPC) → バリデーション
→ bcrypt.hashSync() → app_settings UPDATE
```
依存: `middleware`, `auth`, `adminConfig` (MIN_PASSWORD_LENGTH), `response`, `bcrypt`

### review
**POST** `application/json` | 提出物の承認/却下 (楽観的ロック)
```
withAuth (useAnon) → 権限チェック (submission_type に基づく RPC)
→ ステータス検証 → WHERE version=$v で UPDATE → version++
```
依存: `middleware`, `auth` (createUserClient), `retry`, `response`

### import-organizations
**POST** `multipart/form-data` | 団体 CSV 一括 UPSERT
```
withAuth → 管理者権限チェック → CSV パース → ヘッダー検証
→ upsert(onConflict: organization_code)
```
依存: `middleware`, `auth`, `retry`, `response`

### import-projects
**POST** `multipart/form-data` | 企画 CSV 一括 UPSERT (参照整合性チェック付き)
```
withAuth → 管理者権限チェック → CSV パース → org_code 存在確認
→ code→id 変換 → upsert(onConflict: project_code)
```
依存: `middleware`, `auth`, `retry`, `response`

## 共有モジュール (`_shared/`)

| ファイル | 責務 |
|---------|------|
| `middleware.ts` | `withAuth()` — CORS + JWT 認証ラッパー。全 Edge Function のエントリポイント |
| `cors.ts` | `corsHeaders` 定数 + `handleCors()` プリフライト処理 |
| `response.ts` | `jsonResponse()` — CORS ヘッダー付き JSON レスポンス生成 |
| `auth.ts` | `extractToken()`, `createUserClient()` (RLS 適用クライアント), `PASSWORD_KEYS` 再エクスポート |
| `adminConfig.ts` | `admin.json` から `PASSWORD_KEYS`, `MIN_PASSWORD_LENGTH`, `APP_DEFAULTS` を導出 |
| `admin.json` | ロール定義・バリデーション・デフォルト値の Single Source of Truth |
| `supabase.ts` | `supabaseAdmin` (RLS バイパス) + `supabaseAnon` (RLS 準拠) シングルトン |
| `geminiClient.ts` | Gemini REST API ラッパー, base64 チャンク処理, 20MB 上限, リスクスコア算出 |
| `driveClient.ts` | Google Drive v3 REST API, RS256 JWT 認証, 5分トークンキャッシュ, 自動リトライ |
| `docsClient.ts` | Google Docs API — AI判定レポートの自動生成 |
| `checkItems.ts` | `fetchActiveCheckItems()` — josenai_check_items テーブルからアクティブ項目取得 |
| `retry.ts` | `withRetry()` 指数バックオフ (3回, 1s初期, 2倍率, ジッター付き), 4xx はリトライスキップ |

## 依存関係図

```
middleware.ts ◄──── 全 Edge Function が withAuth() を使用
     │
     ├─ cors.ts        (CORS ヘッダー)
     ├─ response.ts    (JSON レスポンス)
     ├─ auth.ts        (トークン抽出)
     └─ supabase.ts    (DB クライアント)

                    ┌─ submit ─────┬─ geminiClient → Gemini API
                    │              ├─ driveClient  → Google Drive API
                    │              ├─ docsClient   → Google Docs API
                    │              ├─ checkItems
                    │              └─ retry
                    ├─ sandbox ────┬─ geminiClient
                    │              ├─ checkItems
middleware.ts ◄─────┤              └─ retry
(全関数共通)        ├─ delete ─────── driveClient
                    ├─ verify ─────── bcrypt, auth (PASSWORD_KEYS)
                    ├─ update-pw ──── bcrypt, auth, adminConfig
                    ├─ review ─────── auth (createUserClient), retry
                    ├─ import-org ─── auth (createUserClient), retry
                    └─ import-proj ── auth (createUserClient), retry

admin.json ◄─── adminConfig.ts ◄─── auth.ts (re-export)
                                ◄─── update-password
```

## 実装上の注意

- **withAuth**: 全関数の共通エントリポイント。CORS + JWT 認証 + エラーハンドリングを統一
- **bcrypt**: `compareSync()` / `hashSync()` のみ使用 (async は Deno Deploy で Web Worker クラッシュ)
- **CORS**: `cors.ts` で全関数が OPTIONS プリフライト対応 (`Access-Control-Allow-Origin: *`)
- **googleapis**: 未使用 (10MB デプロイ制限のため REST API 直接呼出)
- **Drive トークン**: モジュールレベルで 5 分キャッシュ, 401 時に 1 回再取得
- **retry.ts**: 4xx クライアントエラー (400, 401, 403, 404, 409) はリトライスキップ
- **docsClient**: レポート作成失敗しても提出は継続（ベストエフォート）
- **admin.json**: フロントエンド (`src/shared/constants/adminConfig.js`) とバックエンドで共有

<!-- Generated: 2026-03-05 | Files scanned: 12 | Token estimate: ~850 -->
# Backend (Edge Functions)

## 概要

**ランタイム**: Deno (Supabase Edge Functions) | **言語**: TypeScript
**パス**: `supabase/functions/`

## Edge Functions 一覧

### submit (最複雑)
**POST** | ファイル提出 → AI 判定 → Drive アップロード（スコア付きファイル名） → DB 登録
```
multipart parse → アプリ設定取得
├─ precheck=true:  Gemini 判定のみ → 結果返却 (DB 書込なし)
└─ precheck=false: Gemini 判定 → Drive upload (団体名-企画名-提出先-(スコア%).拡張子) → submissions INSERT
                   → auto_approve 判定 → status='approved'|'pending'
```
依存: `supabaseAdmin`, `geminiClient`, `driveClient`, `retry`

### sandbox
**POST** | AI 判定プレビュー (1日3回制限, DB 保存なし)
```
JWT 認証 → 日次カウント確認 → Gemini 判定 → カウント+1 → 結果返却
```
依存: `supabaseAdmin`, `geminiClient`, `retry`

### delete-submission
**POST** | Drive ファイル削除 (ベストエフォート)
```
JWT 認証 → driveFileId 取得 → Drive 削除 (エラー無視)
```
依存: `supabaseAdmin`, `driveClient`

### verify-admin-password
**POST** | 管理者パスワード検証 (セッション限り)
```
role + password → app_settings からハッシュ取得 → bcrypt.compareSync()
→ { valid: true/false }
```
依存: `supabaseAdmin`, `bcrypt`

### update-password
**POST** | 管理者パスワード変更
```
JWT 認証 → バリデーション → bcrypt.hashSync() → app_settings UPDATE
```
依存: `supabaseAdmin`, `bcrypt`

### review
**POST** | 提出物の承認/却下 (楽観的ロック)
```
JWT 認証 → 権限チェック (submission_type に基づく RPC)
→ ステータス検証 → WHERE version=$v で UPDATE → version++
```
依存: `supabaseAdmin`, `supabaseAnon`, `retry`

### import-organizations
**POST** | 団体 CSV 一括 UPSERT
```
JWT 認証 → CSV パース → ヘッダー検証 → upsert(onConflict: organization_code)
```
依存: `supabaseAdmin`, `retry`

### import-projects
**POST** | 企画 CSV 一括 UPSERT (参照整合性チェック付き)
```
JWT 認証 → CSV パース → org_code 存在確認 → code→id 変換 → upsert
```
依存: `supabaseAdmin`, `retry`

## 共有モジュール (`_shared/`)

| ファイル | 責務 |
|---------|------|
| `supabase.ts` | `supabaseAdmin` (RLS バイパス) + `supabaseAnon` (RLS 準拠) シングルトン |
| `geminiClient.ts` | Gemini REST API ラッパー, base64 チャンク処理, 20MB 上限, リスクスコア算出 |
| `driveClient.ts` | Google Drive v3 REST API, RS256 JWT 認証, 5分トークンキャッシュ, 自動リトライ |
| `retry.ts` | `withRetry()` 指数バックオフ (3回, 1s初期, 2倍率) + `errorResponse()` 標準化 |

## 依存関係図

```
                    ┌─ submit ─────┬─ geminiClient → Gemini API
                    │              ├─ driveClient  → Google Drive API
                    │              └─ retry
                    ├─ sandbox ────┬─ geminiClient
                    │              └─ retry
                    ├─ delete ─────── driveClient
supabase.ts ◄──────┤
(全関数共通)        ├─ verify ─────── bcrypt (sync only!)
                    ├─ update-pw ──── bcrypt (sync only!)
                    ├─ review ─────── retry
                    ├─ import-org ─── retry
                    └─ import-proj ── retry
```

## 実装上の注意

- **bcrypt**: `compareSync()` / `hashSync()` のみ使用 (async は Deno Deploy で Web Worker クラッシュ)
- **CORS**: 全関数が OPTIONS プリフライト対応 (`Access-Control-Allow-Origin: *`)
- **googleapis**: 未使用 (10MB 制限のため REST API 直接呼出)
- **Drive トークン**: モジュールレベルで 5 分キャッシュ, 401 時に 1 回再取得

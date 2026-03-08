<!-- Created: 2026-03-08 | Token estimate: ~1500 -->
# Edge Function API リファレンス

## 共通仕様

### 認証

全 Edge Function は `withAuth()` ミドルウェアで JWT 認証を行う。

```
Authorization: Bearer <supabase-jwt>
```

認証失敗時: `401 { "error": "認証に失敗しました" }`

### CORS

全エンドポイントが `Access-Control-Allow-Origin: *` を返す。OPTIONS プリフライトに自動対応。

### エラーレスポンス形式

```json
{ "error": "エラーメッセージ（日本語）" }
```

### デプロイ

```bash
supabase functions deploy <function-name> --no-verify-jwt
```

`--no-verify-jwt` は必須。全関数が内部で `supabase.auth.getUser()` 認証するため、リレーレベルの JWT 検証は不要。

---

## submit

正式提出エンドポイント。AI 判定 → Google Drive アップロード → Docs レポート → DB 登録を一連で実行。

| 項目 | 値 |
|------|-----|
| **メソッド** | POST |
| **Content-Type** | multipart/form-data |
| **認証** | JWT (全ユーザー) |

### リクエストフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `file` | File | ○ | アップロードファイル（画像/動画） |
| `organizationId` | string | ○ | 団体 UUID |
| `projectId` | string | ○ | 企画 UUID |
| `mediaType` | string | ○ | 媒体種別 |
| `submissionType` | string | ○ | `kikaku` or `koho` |
| `userComment` | string | - | 提出者コメント |
| `precheck` | string | - | `"true"` で AI 判定のみモード |

### レスポンス

**precheck=true 時** (200):
```json
{
  "ai_risk_score": 15,
  "ai_risk_details": { ... },
  "skipped": false,
  "reason": null
}
```

**正式提出時** (200):
```json
{
  "success": true,
  "submission_id": "uuid",
  "ai_risk_score": 5,
  "ai_risk_details": { ... },
  "skipped": false,
  "reason": null,
  "auto_approved": true,
  "docs_url": "https://docs.google.com/..."
}
```

### ステータスコード

| コード | 条件 |
|--------|------|
| 200 | 成功 |
| 400 | 必須項目不足 |
| 401 | 認証失敗 |
| 403 | 提出受付停止中 |
| 404 | 団体/企画が見つからない |
| 500 | Drive エラー / DB エラー / サーバーエラー |

### 処理ステップ

1. `parseFormData` → フォームバリデーション
2. `fetchSettings` → アプリ設定取得
3. 提出受付チェック (`submission_enabled`)
4. *precheck モード*: AI 判定のみ → 結果返却
5. `fetchOrgProject` → 団体名・企画名取得
6. `runAIAnalysis` → Gemini AI 判定（タイムアウト付き）
7. `uploadToDrive` → Drive フォルダ確保 + アップロード + 共有URL
8. `createDocsReport` → AI判定レポート Docs 作成（失敗しても継続）
9. `insertSubmission` → DB INSERT（失敗時は Drive ロールバック削除）
10. `tryAutoApprove` → 自動承認判定

---

## sandbox

事前チェック AI 判定（データ保存なし、日次制限あり）。

| 項目 | 値 |
|------|-----|
| **メソッド** | POST |
| **Content-Type** | multipart/form-data |
| **認証** | JWT (全ユーザー) |

### リクエストフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `file` | File | ○ | チェック対象ファイル |
| `organizationId` | string | ○ | 団体 UUID |
| `projectId` | string | ○ | 企画 UUID |
| `mediaType` | string | ○ | 媒体種別 |
| `submissionType` | string | ○ | `kikaku` or `koho` |

### レスポンス (200)

```json
{
  "ai_risk_score": 25,
  "ai_risk_details": { ... },
  "skipped": false,
  "reason": null,
  "remaining_today": 2
}
```

### ステータスコード

| コード | 条件 |
|--------|------|
| 200 | 成功 |
| 400 | 必須項目不足 |
| 401 | 認証失敗 |
| 404 | プロフィール未作成 |
| 429 | 日次制限到達 |
| 500 | チェック項目取得失敗 / サーバーエラー |

---

## review

提出物の承認/却下（楽観的ロック付き）。

| 項目 | 値 |
|------|-----|
| **メソッド** | POST |
| **Content-Type** | application/json |
| **認証** | JWT + RLS (useAnon) |

### リクエストフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `submissionId` | string | ○ | 提出 UUID |
| `action` | string | ○ | `approve` or `reject` |
| `comment` | string | reject時○ | 審査コメント（却下時必須） |
| `version` | number | ○ | 楽観的ロック用バージョン |

### レスポンス (200)

```json
{ "success": true, "submissionId": "uuid" }
```

### ステータスコード

| コード | 条件 |
|--------|------|
| 200 | 成功 |
| 400 | バリデーションエラー / 既に審査済み |
| 401 | 認証失敗 |
| 403 | 審査権限なし |
| 404 | 提出が見つからない |
| 409 | バージョン競合（楽観的ロック失敗） |

---

## delete-submission

Google Drive ファイル削除（ベストエフォート）。

| 項目 | 値 |
|------|-----|
| **メソッド** | POST |
| **Content-Type** | application/json |
| **認証** | JWT (提出者本人) |

### リクエストフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `driveFileId` | string | ○ | Google Drive ファイル ID |

### レスポンス (200)

```json
{ "success": true }
```

### ステータスコード

| コード | 条件 |
|--------|------|
| 200 | 成功 |
| 400 | driveFileId 未指定 |
| 401 | 認証失敗 |
| 403 | 他ユーザーのファイル |
| 500 | Drive 削除失敗 |

---

## verify-admin-password

管理者パスワード検証（bcrypt）。

| 項目 | 値 |
|------|-----|
| **メソッド** | POST |
| **Content-Type** | application/json |
| **認証** | JWT + RLS (useAnon) |

### リクエストフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `role` | string | ○ | `koho`, `kikaku`, or `super` |
| `password` | string | ○ | プレーンテキストパスワード |

### レスポンス (200)

```json
{ "valid": true }
```

### ステータスコード

| コード | 条件 |
|--------|------|
| 200 | 検証完了（valid: true/false） |
| 400 | 必須項目不足 / 無効なロール |
| 401 | 認証失敗 |
| 500 | パスワード設定未登録 |

---

## update-password

管理者パスワード変更。

| 項目 | 値 |
|------|-----|
| **メソッド** | POST |
| **Content-Type** | application/json |
| **認証** | JWT (管理者のみ) |

### リクエストフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `role` | string | ○ | `koho`, `kikaku`, or `super` |
| `newPassword` | string | ○ | 新パスワード（8文字以上） |

### レスポンス (200)

```json
{ "success": true }
```

### ステータスコード

| コード | 条件 |
|--------|------|
| 200 | 成功 |
| 400 | バリデーションエラー |
| 401 | 認証失敗 |
| 403 | 管理者権限なし |
| 500 | 更新失敗 |

---

## import-organizations

団体 CSV 一括インポート。

| 項目 | 値 |
|------|-----|
| **メソッド** | POST |
| **Content-Type** | multipart/form-data |
| **認証** | JWT (管理者のみ) |

### リクエストフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `file` | File | ○ | CSV ファイル |

CSV ヘッダー (必須): `organization_code`, `organization_name`, `category`

### レスポンス (200)

```json
{ "success": true, "count": 50 }
```

### ステータスコード

| コード | 条件 |
|--------|------|
| 200 | 成功 |
| 400 | CSV パースエラー / ヘッダー不足 |
| 401 | 認証失敗 |
| 403 | 管理者権限なし |
| 500 | DB エラー |

---

## import-projects

企画 CSV 一括インポート（参照整合性チェック付き）。

| 項目 | 値 |
|------|-----|
| **メソッド** | POST |
| **Content-Type** | multipart/form-data |
| **認証** | JWT (管理者のみ) |

### リクエストフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `file` | File | ○ | CSV ファイル |

CSV ヘッダー (必須): `project_code`, `project_name`, `organization_code`

### レスポンス (200)

```json
{ "success": true, "count": 150 }
```

### ステータスコード

| コード | 条件 |
|--------|------|
| 200 | 成功 |
| 400 | CSV パースエラー / ヘッダー不足 / 存在しない団体コード |
| 401 | 認証失敗 |
| 403 | 管理者権限なし |
| 500 | DB エラー |

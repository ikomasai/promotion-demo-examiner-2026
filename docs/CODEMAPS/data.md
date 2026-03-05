<!-- Generated: 2026-03-05 | Files scanned: 3 | Token estimate: ~800 -->
# Data

## テーブル一覧

全テーブルに `josenai_` プレフィックス (共有 Supabase プロジェクト)。全テーブル RLS 有効。

| テーブル | 用途 | 主要カラム |
|---------|------|-----------|
| `josenai_profiles` | ユーザープロファイル | user_id (FK→auth.users), sandbox_count_today, sandbox_count_date |
| `josenai_organizations` | 団体マスタ | organization_code (UNIQUE), organization_name, category, is_active |
| `josenai_projects` | 企画マスタ | project_code (UNIQUE), project_name, organization_id (FK) |
| `josenai_submissions` | 提出物 | user_id, org_id, project_id, submission_type, media_type, drive_file_id/url, ai_risk_score (0-100), ai_risk_details (JSONB), status, version (楽観ロック) |
| `josenai_media_specs` | メディア仕様 | media_type (UNIQUE), display_name, allowed_extensions[], max_file_size_mb |
| `josenai_check_items` | AI チェック項目 | category (prohibited/copyright/format), item_code, risk_weight (5/15/30) |
| `josenai_rule_documents` | ルール文書 | document_type, title, content (Markdown), version |
| `josenai_app_settings` | アプリ設定 (KV) | key (PK), value, description |

## テーブル関係図

```
auth.users
  │
  ├──< josenai_profiles (user_id FK, CASCADE)
  │
  ├──< josenai_submissions (user_id FK)
  │         │
  │         ├──> josenai_organizations (organization_id FK)
  │         │         │
  │         │         └──< josenai_projects (organization_id FK, CASCADE)
  │         │                   ▲
  │         └─────────────────────┘ (project_id FK)
  │
  └──< josenai_submissions.reviewed_by (FK)

josenai_media_specs ─── (参照のみ, FK なし)
josenai_check_items ─── (参照のみ, FK なし)
josenai_rule_documents ─ (独立)
josenai_app_settings ── (独立, KV ストア)
```

## RLS ポリシー概要

**ヘルパー関数**:
- `fn_is_josenai_koho()` / `fn_is_josenai_kikaku()` / `fn_is_josenai_admin()` / `fn_is_josenai_reviewer()`
- 内部で `fn_has_screen_access(TEXT)` を呼出

| テーブル | SELECT | INSERT/UPDATE/DELETE |
|---------|--------|---------------------|
| profiles | 自分のみ | 自分のみ |
| organizations | 全員 | 管理者のみ |
| projects | 全員 | 管理者のみ |
| submissions | 自分 + ロール別 (koho→koho, kikaku→kikaku, admin→全) | 自分 (INSERT), ロール別 (UPDATE) |
| media_specs | 全員 | なし (参照データ) |
| check_items | 全員 | なし (参照データ) |
| rule_documents | 全員 | レビューア (UPDATE) |
| app_settings | 全員 (パスワードハッシュ除く) | 管理者のみ |

## インデックス

- `josenai_organizations`: `organization_code`, `is_active` (部分)
- `josenai_projects`: `project_code`, `organization_id`, `is_active` (部分)
- `josenai_submissions`: `user_id`, `status`, `submission_type`, `created_at DESC`, `reviewed_by` (部分)
- `josenai_check_items`: `category`, `is_active` (部分)

## マイグレーション履歴

| ファイル | 内容 |
|---------|------|
| `josenai_001_schema.sql` (225行) | 8テーブル, トリガー, インデックス |
| `josenai_002_rls.sql` (207行) | RLS ポリシー, ヘルパー関数 |
| `josenai_003_seed.sql` (159行) | シードデータ (団体5, 企画6, メディア8, チェック項目20, ルール3, 設定) |

<!-- Created: 2026-03-08 | Token estimate: ~1000 -->
# Data Flow

## 1. 認証フロー

```
┌─────────┐    signIn/signUp     ┌──────────────┐
│ Login   │ ──────────────────→  │ Supabase Auth │
│ Screen  │ ←────────────────    │ (JWT 発行)    │
│         │    user + session    └──────────────┘
└────┬────┘                              │
     │                                   │
     │  初回ログイン時                      │
     │  (AuthProvider 内)                  │
     ▼                                   ▼
┌──────────────────────────────────────────┐
│ user_profiles UPSERT (共有テーブル)        │
│ josenai_profiles UPSERT (情宣固有)        │
└──────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────┐
│ AdminPasswordModal 表示                              │
│  ├─ [スキップ] → 一般ユーザーとして続行                  │
│  ├─ [広報部]   → verify-admin-password → koho 権限    │
│  ├─ [企画管理部] → verify-admin-password → kikaku 権限  │
│  └─ [管理者]   → verify-admin-password → super 権限   │
│                                                      │
│  認証成功 → sessionStorage に screen セット保存           │
│  (ページリロード時に自動復元)                              │
└────────────────────────────────────────────────────┘
     │
     ▼
  DrawerNavigator (ロールに応じた画面表示)
```

## 2. 提出フロー

```
┌──────────────┐
│ SubmitScreen │
│ (フォーム入力) │
└──────┬───────┘
       │ useSubmission.submit()
       ▼
┌──────────────────────────────────────────────────────────┐
│ submit Edge Function                                      │
│                                                           │
│  1. parseFormData()                                       │
│  2. fetchSettings()      ── josenai_app_settings SELECT   │
│  3. submission_enabled チェック                             │
│  4. ファイル → Uint8Array 変換                              │
│                                                           │
│  ┌─ precheck=true ─────────────────────────────────┐     │
│  │  fetchActiveCheckItems()                          │     │
│  │  analyzeWithTimeout()  ── Gemini API              │     │
│  │  → AI結果のみ返却 (Drive/DB なし)                   │     │
│  └───────────────────────────────────────────────────┘     │
│                                                           │
│  ┌─ 正式提出 ────────────────────────────────────────┐    │
│  │  5. fetchOrgProject()  ── 団体名・企画名取得          │    │
│  │  6. runAIAnalysis()    ── Gemini AI 判定             │    │
│  │  7. uploadToDrive()    ── フォルダ確保 + アップロード    │    │
│  │     └→ Google Drive API (ensureFolder → upload → share) │  │
│  │  8. createDocsReport() ── AI判定レポート Docs 生成      │    │
│  │     └→ Google Docs API (失敗しても継続)                │    │
│  │  9. insertSubmission() ── josenai_submissions INSERT    │    │
│  │     └→ 失敗時: Drive ファイルをロールバック削除           │    │
│  │  10. tryAutoApprove()  ── 自動承認判定                  │    │
│  │     └→ 条件充足: status='approved' へ UPDATE           │    │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ useAICheckFlow (共有フック)                     │
│  フェーズ遷移: form → executing → risk_check   │
│  ├─ 低リスク (0-10%): そのまま提出              │
│  ├─ 中リスク (11-50%): 確認モーダル → 提出       │
│  └─ 高リスク (51-100%): 理由入力 → 提出          │
│                                               │
│  タイムアウト: 30秒後に「スキップ」ボタン表示       │
│  → skipped=true, ai_risk_score=null            │
└──────────────────────────────────────────────┘
```

## 3. 審査フロー

```
┌───────────────────────────────────────────────┐
│ DashboardScreen                                │
│  useReviewSubmissions() → josenai_submissions   │
│  SELECT (RLS: submission_type でフィルタ)        │
└──────┬────────────────────────────────────────┘
       │ 「審査」ボタン
       ▼
┌───────────────────────────────────────────────┐
│ ReviewModal                                    │
│  approve/reject 選択 + コメント入力              │
│  → useReview().submitReview()                   │
└──────┬────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────┐
│ review Edge Function                                   │
│  1. withAuth (useAnon: RLS 適用)                       │
│  2. submission 取得 (supabaseAdmin)                    │
│  3. 権限チェック: fn_is_josenai_koho/kikaku/admin RPC   │
│  4. ステータス検証 (pending のみ審査可)                   │
│  5. 楽観的ロック UPDATE:                                │
│     WHERE id=$id AND version=$v                        │
│     SET status, reviewer_comment, reviewed_at,          │
│         reviewed_by, version+1                          │
│  6. version 不一致 → 409 Conflict                       │
└───────────────────────────────────────────────────────┘
```

## 4. 事前チェックフロー

```
┌─────────────────┐
│ PrecheckScreen  │
│ (フォーム入力)    │
└──────┬──────────┘
       │ usePrecheck.runPrecheck()
       ▼
┌──────────────────────────────────────────────────┐
│ sandbox Edge Function                              │
│  1. withAuth                                       │
│  2. 日次カウント確認 (josenai_profiles)               │
│     └→ sandbox_count_date ≠ 今日 → カウントリセット    │
│  3. 制限チェック (effectiveCount >= dailyLimit → 429)  │
│  4. fetchActiveCheckItems()                         │
│  5. analyzeWithTimeout() → Gemini AI 判定            │
│  6. カウント+1 UPDATE (josenai_profiles)              │
│  7. 結果返却 + remaining_today                       │
└──────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ useAICheckFlow (共有フック)                     │
│  結果表示 + 残り回数表示                         │
│  ※ DB 保存なし（プライバシー保護）               │
└──────────────────────────────────────────────┘
```

<!-- Updated: 2026-03-08 | Files scanned: 48 | Token estimate: ~1000 -->
# Frontend

## 画面一覧 (8画面)

| 画面名 | ファイル | ロール | 主要 Hook |
|--------|---------|--------|-----------|
| ログイン | `src/features/auth/screens/LoginScreen.jsx` | 未認証 | `useAuth()` |
| 事前チェック | `src/features/submission/screens/PrecheckScreen.jsx` | 全員 | `usePrecheck()`, `useAICheckFlow()` |
| 正式提出 | `src/features/submission/screens/SubmitScreen.jsx` | 全員 | `useSubmission()`, `useAICheckFlow()` |
| 提出履歴 | `src/features/submission/screens/HistoryScreen.jsx` | 全員 | `useSubmissionHistory()`, `useSubmissionDelete()` |
| 審査ダッシュボード | `src/features/review/screens/DashboardScreen.jsx` | レビューア | `useReviewSubmissions()`, `useReview()` |
| ルール管理 | `src/features/rules/screens/RuleListScreen.jsx` | レビューア | `useRuleDocuments()` |
| マスタ管理 | `src/features/master/screens/MasterScreen.jsx` | 管理者 | `useMasterData()`, `useCsvImport()` |
| システム設定 | `src/features/settings/screens/SettingsScreen.jsx` | レビューア | `useAppSettings()` |

## ルーティング

```
AppNavigator
├─ [未認証] LoginScreen + AdminPasswordModal (overlay)
└─ [認証済] DrawerNavigator
     ├─ 事前チェック（事前確認）  ← 全ユーザー
     ├─ 正式提出
     ├─ 提出履歴
     ├─ 審査ダッシュボード         ← レビューア以上
     ├─ ルール管理
     ├─ システム設定
     └─ マスタ管理                 ← 管理者のみ
```

## Feature モジュール構成

```
src/features/
├─ auth/          screens: 1, components: 1 (AdminPasswordModal)
├─ submission/    screens: 3, components: 12, hooks: 8
├─ review/        screens: 1, components: 3, hooks: 2
├─ rules/         screens: 1, components: 3, hooks: 1
├─ master/        screens: 1, components: 3, hooks: 2
└─ settings/      screens: 1, components: 3, hooks: 1
```

## Shared コンポーネント (`src/shared/components/`)

| コンポーネント | 用途 |
|--------------|------|
| `Button` | 汎用ボタン（solid/outline、5色、3サイズ） |
| `Badge` | ステータスバッジ |
| `Card` | コンテンツカード |
| `Banner` | 情報バナー |
| `ConfirmModal` | 確認モーダルダイアログ |
| `FormInput` | ラベル・エラー表示付きテキスト入力 |
| `LoadingSpinner` | 全画面ローディング |
| `ScreenErrorBoundary` | 画面例外キャッチ（App.jsx ルート + 各画面） |
| `SkeletonLoader` / `SkeletonCard` | データ読込プレースホルダ |
| `PlaceholderContent` | 空状態表示 |

## Custom Hooks マッピング

**Submission hooks** (`src/features/submission/hooks/`):
- `usePrecheck()` → sandbox Edge Function, 日次制限管理
- `useSubmission()` → submit Edge Function, 5フェーズ (form→executing→risk_check→submitting→done)
- `useAICheckFlow()` → **PrecheckScreen/SubmitScreen 共有フック**。AI判定の共通フェーズ遷移ロジック（タイムアウト、スキップ、中リスク確認、高リスク理由入力）を抽出
- `useSubmissionHistory()` → josenai_submissions SELECT
- `useSubmissionDelete()` → delete-submission Edge Function
- `useOrganizations()` / `useProjects()` → マスタデータ取得
- `useMediaSpecs()` → メディア種別仕様取得

**Review hooks** (`src/features/review/hooks/`):
- `useReviewSubmissions()` → RLS フィルタ付き提出一覧
- `useReview()` → review Edge Function (承認/却下)

**Other hooks**:
- `useRuleDocuments()` → ルールドキュメント CRUD
- `useMasterData()` / `useCsvImport()` → CSV インポート
- `useAppSettings()` → アプリ設定 CRUD

## サービス層

`src/services/supabase/client.js` — Supabase シングルトン
- Auth: Email/Password, セッション自動更新
- DB: RLS 保護テーブルアクセス
- Edge Functions: `supabase.functions.invoke()`
- 環境変数: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

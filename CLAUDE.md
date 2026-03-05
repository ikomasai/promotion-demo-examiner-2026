# CLAUDE.md

このファイルは Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドです。

## プロジェクト概要

生駒祭 2026 情宣AI判定システム。Web PWA として Gemini AI が広報物を大学ガイドラインに照らして判定し、人間によるレビュー機能も備えたシステム。

**技術スタック**: Expo SDK 52 (React Native Web) + Supabase (Auth, DB, Edge Functions) + Google Drive API + Gemini API

## コマンド

```bash
npm run web              # 開発サーバー起動（http://localhost:8081）
npm run build:web        # 本番ビルド → dist/
npx playwright test      # E2E テスト（開発サーバー自動起動）
npx playwright test --ui # E2E テスト（インタラクティブ UI）
```

Edge Functions (Deno/TypeScript):
```bash
supabase functions serve                    # ローカル開発（.env を読み込む）
supabase functions deploy <function-name>   # 単一関数のデプロイ
```

## MCP ツール活用

このプロジェクトでは以下の MCP サーバーが利用可能。CLI ツールが未認証・未インストールでも MCP 経由で操作できる。

### Supabase MCP

プロジェクトの `.mcp.json` で設定済み。DB 操作やデプロイに活用する。

| ツール | 用途 |
|--------|------|
| `execute_sql` | テーブル確認、データ参照・更新、スキーマ変更 |
| `list_tables` | テーブル一覧の取得 |
| `list_migrations` / `apply_migration` | マイグレーション管理 |
| `deploy_edge_function` | Edge Functions のデプロイ |
| `get_logs` | Edge Functions のログ確認（エラー調査） |
| `list_projects` / `get_project` | プロジェクト情報の確認 |

**活用場面**:
- DB スキーマやデータの確認 → `execute_sql` で直接クエリ
- Edge Functions デプロイ → `deploy_edge_function`（CLI の `supabase functions deploy` の代替）
- 本番エラー調査 → `get_logs` でリアルタイムログ取得
- マイグレーション適用 → `apply_migration`

### Playwright MCP

ブラウザ操作による動作確認・E2E テストに使用する。

| ツール | 用途 |
|--------|------|
| `browser_navigate` | URL への遷移 |
| `browser_click` / `browser_fill_form` | UI 操作（クリック、フォーム入力） |
| `browser_take_screenshot` | スクリーンショット取得（視覚的検証） |
| `browser_snapshot` | ページの DOM スナップショット |
| `browser_console_messages` | コンソールログ確認 |
| `browser_network_requests` | ネットワークリクエスト監視 |

**活用場面**:
- 画面修正後の視覚的な確認 → `browser_navigate` + `browser_take_screenshot`
- フォーム送信の動作検証 → `browser_fill_form` + `browser_click`
- フロントエンドのエラー調査 → `browser_console_messages`

### Chrome DevTools MCP

より詳細なブラウザデバッグが必要な場合に使用する。

| ツール | 用途 |
|--------|------|
| `take_screenshot` / `take_snapshot` | 画面キャプチャ・DOM 取得 |
| `evaluate_script` | JavaScript の実行 |
| `list_console_messages` | コンソールログ一覧 |
| `list_network_requests` | ネットワークリクエスト一覧 |

## アーキテクチャ

### エントリポイントとプロバイダ階層

`expo/AppEntry` → `App.jsx` → GestureHandlerRootView → AuthProvider → AdminProvider → ToastProvider → AppNavigator

**重要**: `package.json` の `"main"` は必ず `"expo/AppEntry"` にすること。`"App.jsx"` に変えるとエラーなしで白画面になる。

### ナビゲーション

React Navigation（Expo Router 不使用）。`@react-navigation/drawer` でロールベースの画面表示制御:
- **全ユーザー**: サンドボックス、提出、履歴
- **レビューア** (koho/kikaku/admin): + ダッシュボード、ルール管理、設定
- **管理者のみ**: + マスタ管理

### ディレクトリ構成

```
src/
├── features/{feature}/screens/    # 画面コンポーネント (.jsx)
├── features/{feature}/components/ # 機能別コンポーネント
├── features/{feature}/hooks/      # 機能別フック
├── navigation/                    # AppNavigator, DrawerNavigator
├── shared/contexts/               # AuthContext, AdminContext, ToastContext
├── shared/components/             # LoadingSpinner, ScreenErrorBoundary, SkeletonLoader
├── shared/hooks/                  # useResponsive
└── services/supabase/client.js    # Supabase クライアント（シングルトン）
```

### 認証フロー

- メール/パスワード認証（`@kindai.ac.jp` ドメイン限定）
- 初回ログイン時に `user_profiles` + `josenai_profiles` を自動作成
- 管理者アクセスは別系統: `verify-admin-password` Edge Function によるパスワード認証（セッション限り、DB 書き込みなし）

### Edge Functions (`supabase/functions/`)

| 関数名 | 機能 |
|--------|------|
| `submit` | ファイルアップロード → Google Drive → Gemini AI 判定 → DB 登録（最も複雑） |
| `sandbox` | プレビュー専用 AI 判定（DB 書き込みなし、1日3回制限） |
| `delete-submission` | Drive + DB からの削除（所有者チェック付き） |
| `verify-admin-password` | 管理者ロールの bcrypt パスワード検証 |
| `update-password` | 管理者パスワード変更 |
| `review` | 提出物の承認・却下 |
| `import-organizations` | 団体 CSV インポート |
| `import-projects` | 企画 CSV インポート |

共有モジュール (`_shared/`): `driveClient.ts`, `geminiClient.ts`, `retry.ts`, `supabase.ts`

### データベース

全テーブルに `josenai_` プレフィックス（共有 Supabase プロジェクト）。全テーブルに RLS 設定済み。主要テーブル: `josenai_submissions`, `josenai_organizations`, `josenai_projects`, `josenai_rules`, `josenai_app_settings`, `josenai_profiles`

## コーディング規約

- **言語**: フロントエンドは JavaScript (JSX)、Edge Functions のみ TypeScript
- **コンポーネント**: 関数コンポーネントのみ、DrawerNavigator で `withErrorBoundary()` ラップ
- **状態管理**: React Context（Redux/Zustand 不使用）— `useAuth()`, `useAdmin()`, `useToast()`
- **スタイル**: React Native `StyleSheet.create()`、ダークテーマ（背景 #1a1a2e、アクセント #4dabf7）
- **レスポンシブ**: `useResponsive()` フック — モバイル (<768px)、タブレット (768-1023px)、デスクトップ (>=1024px)
- **JSDoc**: エクスポートされる関数・コンポーネントには日本語 JSDoc コメントを記述
- **画面名**: 日本語（例: `"サンドボックス"`, `"提出"`）

## 環境変数

フロントエンド（バンドル対象、プレフィックス必須）:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Edge Functions (Supabase Secrets):
- `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GOOGLE_DRIVE_SERVICE_ACCOUNT`（JSON）, `GOOGLE_DRIVE_ROOT_FOLDER_ID`

## デプロイ

- **フロントエンド**: `main` ブランチへの push → GitHub Actions → `expo export --platform web` → GitHub Pages
- **Edge Functions**: 手動で `supabase functions deploy <name>` または Supabase MCP の `deploy_edge_function`

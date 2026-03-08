# 生駒祭 2026 情宣AI判定システム

近畿大学 生駒祭 2026 の情宣物（ポスター・ビラ・SNS用画像/動画等）が大学祭実行委員会のガイドラインに適合しているかを **Gemini AI** が自動判定し、人間による審査と組み合わせて業務を効率化する Web アプリケーション（PWA）。

AI 判定はリスク要因の機械的検出を行う補助ツールであり、最終判断は人間の審査者が行います。

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | Expo SDK 52 (React Native Web) |
| ホスティング | GitHub Pages |
| バックエンド | Supabase (Auth, Database, Edge Functions) |
| ファイル保存 | Google Drive REST API v3（サービスアカウント認証） |
| AI 判定 | Gemini API (gemini-2.0-flash-lite) |
| E2E テスト | Playwright |

## クイックスタート

### 前提条件

- Node.js 20+
- npm
- Supabase プロジェクト（Auth, DB, Edge Functions 設定済み）
- Google Cloud サービスアカウント（Drive API 有効化済み）
- Gemini API キー

### セットアップ

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env を編集し、Supabase URL / Anon Key を設定

# 開発サーバー起動
npm run web
# → http://localhost:8081
```

### Edge Functions（ローカル開発）

```bash
# Supabase CLI が必要
supabase functions serve   # .env を読み込んでローカル実行
```

## ディレクトリ構成

```
src/
├── features/           # 機能ドメイン（auth, submission, review, rules, master, settings）
│   └── {feature}/
│       ├── screens/    # 画面コンポーネント (.jsx)
│       ├── components/ # 機能別コンポーネント
│       └── hooks/      # 機能別カスタムフック
├── shared/             # 共通コンポーネント・コンテキスト・フック
├── navigation/         # AppNavigator, DrawerNavigator
└── services/           # Supabase クライアント

supabase/functions/     # Edge Functions (Deno/TypeScript)
├── submit/             # 正式提出（AI判定 + Drive + DB）
├── sandbox/            # 事前チェック（AI判定のみ）
├── review/             # 審査（承認/却下）
├── delete-submission/  # 提出削除
├── verify-admin-password/  # 管理者パスワード検証
├── update-password/    # パスワード変更
├── import-organizations/   # 団体 CSV インポート
├── import-projects/    # 企画 CSV インポート
└── _shared/            # 共有モジュール（認証・Drive・Gemini・ミドルウェア等）

config/                 # アプリ設定（admin.json: ロール定義）
docs/                   # ドキュメント
```

## 主要コマンド

| コマンド | 説明 |
|---------|------|
| `npm run web` | 開発サーバー起動 |
| `npm run build:web` | 本番ビルド → `dist/` |
| `npm run lint` | ESLint 実行 |
| `npm run format` | Prettier フォーマット |
| `npx playwright test` | E2E テスト実行 |
| `supabase functions deploy <name>` | Edge Function デプロイ |

## デプロイ

### フロントエンド（GitHub Pages）

`main` ブランチへの push で GitHub Actions が自動実行:

1. `npm ci` → `npm run lint` → `expo export --platform web`
2. `dist/` を GitHub Pages にデプロイ

リポジトリ Secrets に以下を設定:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Edge Functions

```bash
# 個別デプロイ（--no-verify-jwt 必須）
supabase functions deploy submit --no-verify-jwt
supabase functions deploy sandbox --no-verify-jwt
supabase functions deploy review --no-verify-jwt
# ... 他の関数も同様
```

> `--no-verify-jwt`: 全関数が内部で `supabase.auth.getUser()` による認証を行うため、リレーレベルの JWT 検証は不要。

### Supabase Secrets

```bash
supabase secrets set GEMINI_API_KEY=...
supabase secrets set GOOGLE_DRIVE_SERVICE_ACCOUNT='{"type":"service_account",...}'
supabase secrets set GOOGLE_DRIVE_ROOT_FOLDER_ID=...
```

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/spec.md](docs/spec.md) | プロジェクト仕様書（機能要件・DB設計・API設計） |
| [docs/operation-guide.md](docs/operation-guide.md) | 運用ガイド |
| [docs/tasks.md](docs/tasks.md) | タスク管理 |
| [docs/CODEMAPS/](docs/CODEMAPS/) | アーキテクチャ・コードマップ |
| [docs/checklists/](docs/checklists/) | QA・セキュリティチェックリスト |
| [CLAUDE.md](CLAUDE.md) | Claude Code ガイド |

## ライセンス

MIT License

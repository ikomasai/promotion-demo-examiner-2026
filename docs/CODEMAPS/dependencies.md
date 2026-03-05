<!-- Generated: 2026-03-05 | Files scanned: 4 | Token estimate: ~600 -->
# Dependencies

## 外部サービス統合

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│  Frontend   │────>│  Supabase        │     │ Google Drive   │
│  (Expo Web) │     │  ├─ Auth         │     │  (REST v3)     │
│             │     │  ├─ Database     │     │  RS256 JWT認証  │
│             │     │  └─ Edge Funcs ──│────>│  5分トークンキャッシュ│
└─────────────┘     └──────────────────┘     └───────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │  Gemini AI       │
                    │  (REST API)      │
                    │  リスクスコア判定   │
                    └──────────────────┘
```

## 主要 npm パッケージ

**コアフレームワーク**:
- `expo` ~52.0.0, `react` 18.3.1, `react-native` 0.76.5, `react-native-web` ~0.19.13

**ナビゲーション**:
- `@react-navigation/drawer` ^6.6.6, `@react-navigation/native` ^6.1.9

**バックエンド統合**:
- `@supabase/supabase-js` ^2.39.0, `papaparse` ^5.4.1

**アニメーション/ジェスチャー**:
- `react-native-gesture-handler` ~2.20.0, `react-native-reanimated` ~3.16.0

**開発ツール**:
- `typescript` ^5.3.3, `@playwright/test` ^1.58.0, `@babel/core` ^7.24.0

**パッケージマネージャ**: npm

## 環境変数マッピング

| 変数 | 用途 | 使用箇所 |
|------|------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | Frontend, CI/CD |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー | Frontend, CI/CD |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 管理者アクセス | Edge Functions (auto) |
| `GEMINI_API_KEY` | Gemini AI API キー | Edge Functions |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT` | サービスアカウント JSON | Edge Functions |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Drive ルートフォルダ | Edge Functions |

## CI/CD パイプライン

**ファイル**: `.github/workflows/deploy.yml`
**トリガー**: `main` ブランチ push / 手動実行

```
checkout → setup Node 20 (npm cache)
  → npm ci
  → expo export --platform web (環境変数注入)
  → configure GitHub Pages
  → upload artifact (dist/)
  → deploy to GitHub Pages
```

**Edge Functions デプロイ**: 手動 (`supabase functions deploy <name>` or Supabase MCP)

## ファイル構成サマリ

```
.github/workflows/deploy.yml   CI/CD パイプライン
.env.example                    環境変数テンプレート
app.json                        Expo 設定 (アプリ名: 生駒祭 情宣AI)
package.json                    依存関係 (npm)
supabase/config.toml            Supabase ローカル設定
```

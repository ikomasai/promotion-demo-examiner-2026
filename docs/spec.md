# プロジェクト仕様書

## プロジェクト概要

生駒祭 2026 で使用する情宣物（ポスター、ビラ、デジタルサイネージ用画像・動画等）および SNS 用宣伝素材が、大学祭実行委員会の定める「情宣ルール」および「著作物取り扱いガイドライン」に適合しているかを AI が自動判定し、審査業務を効率化するシステム。

> **AI判定の位置づけ**: 本システムの AI 判定（Gemini API）はリスク要因の機械的検出を行う補助ツールであり、法的助言・著作権判断を提供するものではない。最終判断は人間の審査者が行う。アプリ UI 上でもこの旨を明示すること。

### 提出先部局と審査部署

| 提出先 (submission_type) | 内容 | 審査部署 | Google Drive 保存先 |
|-------------------------|------|----------|-------------------|
| 企画管理部 (`kikaku`) | 企画で制作した情宣素材 | 企画管理部 | `/生駒祭2026/企画物/{団体名}/` |
| 広報部 (`koho`) | Twitter/Instagram 用画像・動画 | 広報部 | `/生駒祭2026/SNS/{団体名}/` |

Web アプリケーション（PWA）として動作し、PC とスマートフォンの両方に対応する。

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React Native (Expo) Web |
| ホスティング | GitHub Pages |
| バックエンド | Supabase (Auth, Database, Edge Functions) |
| ファイル保存 | Google Drive（API 経由） |
| AI | Gemini API (gemini-2.0-flash-lite) |
| 使用言語 | JavaScript（フロントエンド）/ TypeScript（Edge Functions・Deno） |

### 環境変数

| 変数名 | 用途 | 設定先 |
|--------|------|--------|
| EXPO_PUBLIC_SUPABASE_URL | Supabase プロジェクト URL | フロントエンド |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Supabase 匿名キー | フロントエンド |
| SUPABASE_SERVICE_ROLE_KEY | Supabase サービスロールキー | Edge Functions (Secrets) |
| GEMINI_API_KEY | Gemini API キー | Edge Functions (Secrets) |
| GOOGLE_DRIVE_SERVICE_ACCOUNT | Google Drive サービスアカウント JSON | Edge Functions (Secrets) |
| GOOGLE_DRIVE_ROOT_FOLDER_ID | Google Drive ルートフォルダ ID | Edge Functions (Secrets) |

## 対応プラットフォーム

| デバイス | 画面幅 |
|----------|--------|
| PC | 768px 以上 |
| スマートフォン | 768px 未満 |

## ナビゲーション構成

サイドバー（Drawer）ナビゲーションを採用している。

### レスポンシブ対応

| 画面サイズ | サイドバー表示 | 操作方法 |
|-----------|--------------|---------|
| PC（768px以上） | 常時表示 | クリックで画面遷移 |
| スマホ（768px未満） | 非表示（オーバーレイ） | ハンバーガーメニュー（☰）で開閉 |

### タブ構成（7画面）

| No. | 画面名 | 対象 | 説明 |
|-----|--------|------|------|
| 1 | サンドボックス | 全員 | AI判定の事前確認（1日3回まで） |
| 2 | 提出 | 全員 | 企画管理部 or 広報部を選択して正式提出 |
| 3 | 提出履歴 | 全員 | 自分の提出履歴を確認 |
| 4 | ダッシュボード | 管理者 | 担当範囲の提出一覧・審査 |
| 5 | ルール管理 | 管理者 | 情宣ルール・ガイドラインの編集 |
| 6 | マスタ管理 | 管理者 | 団体・企画の CSV インポート |
| 7 | 設定 | 管理者 | システム設定 |

### 管理者権限構造

共有プロジェクトの screen-based RBAC を使用し、`fn_has_screen_access()` でアクセス制御する。

| 管理者種別 | screen 識別子 | ダッシュボード閲覧範囲 | マスタ管理 | 設定 |
|-----------|--------------|---------------------|-----------|------|
| 広報部 | josenai_review_koho | koho提出のみ | × | × |
| 企画管理部 | josenai_review_kikaku | kikaku提出のみ | × | × |
| 管理者 | josenai_review_koho, josenai_review_kikaku, josenai_admin | 全て（フィルタ切替可） | ○ | ○ |

## ディレクトリ構造

```
project-root/
├── docs/                               # ドキュメント
│   ├── spec.md                         # プロジェクト仕様書
│   ├── operation-guide.md              # 運用ガイド
│   └── tasks.md                        # タスク管理
│
├── .github/
│   └── workflows/
│       └── deploy.yml                  # GitHub Pages 自動デプロイ
│
├── supabase/
│   ├── functions/                      # Edge Functions
│   │   ├── sandbox/
│   │   │   └── index.ts
│   │   ├── submit/
│   │   │   └── index.ts
│   │   ├── review/
│   │   │   └── index.ts
│   │   ├── verify-admin-password/
│   │   │   └── index.ts
│   │   ├── import-organizations/
│   │   │   └── index.ts
│   │   ├── import-projects/
│   │   │   └── index.ts
│   │   └── _shared/
│   │       ├── supabase.ts
│   │       ├── driveClient.ts
│   │       └── geminiClient.ts
│   ├── migrations/
│   │   ├── josenai_001_schema.sql
│   │   ├── josenai_002_rls.sql
│   │   └── josenai_003_seed.sql
│   └── config.toml
│
├── src/
│   ├── features/                       # 機能ごとにまとめる
│   │   ├── auth/                       # 認証
│   │   │   ├── components/
│   │   │   │   └── AdminPasswordModal.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.js
│   │   │   ├── screens/
│   │   │   │   └── LoginScreen.jsx
│   │   │   └── constants.js
│   │   │
│   │   ├── submission/                 # 提出機能
│   │   │   ├── components/
│   │   │   │   ├── FileUploader.jsx
│   │   │   │   ├── OrganizationSelect.jsx  # 団体プルダウン
│   │   │   │   ├── ProjectSelect.jsx       # 企画プルダウン
│   │   │   │   ├── RiskScoreDisplay.jsx
│   │   │   │   └── SubmissionForm.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── useOrganizations.js     # 団体一覧取得
│   │   │   │   ├── useProjects.js          # 企画一覧取得
│   │   │   │   └── useSubmission.js
│   │   │   ├── screens/
│   │   │   │   ├── SandboxScreen.jsx
│   │   │   │   ├── SubmitScreen.jsx
│   │   │   │   └── HistoryScreen.jsx
│   │   │   └── constants.js
│   │   │
│   │   ├── review/                     # 審査機能（管理者）
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   │   └── DashboardScreen.jsx
│   │   │   └── constants.js
│   │   │
│   │   ├── rules/                      # ルール管理（管理者）
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   │   └── RuleListScreen.jsx
│   │   │   └── constants.js
│   │   │
│   │   ├── master/                     # マスタ管理（管理者）
│   │   │   ├── components/
│   │   │   │   ├── CsvImporter.jsx         # CSV インポート
│   │   │   │   ├── OrganizationTable.jsx   # 団体一覧テーブル
│   │   │   │   └── ProjectTable.jsx        # 企画一覧テーブル
│   │   │   ├── hooks/
│   │   │   │   └── useCsvImport.js
│   │   │   ├── screens/
│   │   │   │   └── MasterScreen.jsx
│   │   │   └── constants.js
│   │   │
│   │   └── settings/                   # 設定（管理者）
│   │       ├── screens/
│   │       │   └── SettingsScreen.jsx
│   │       └── constants.js
│   │
│   ├── shared/                         # 共通で使うもの
│   │   ├── components/
│   │   │   ├── PlaceholderContent.jsx
│   │   │   └── ScreenErrorBoundary.jsx
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── contexts/
│   │
│   ├── navigation/                     # ナビゲーション
│   │   ├── AppNavigator.jsx
│   │   ├── DrawerNavigator.jsx
│   │   └── components/
│   │       └── CustomDrawerContent.jsx
│   │
│   ├── services/                       # 共通サービス
│   │   └── supabase/
│   │       └── client.js
│   │
│   └── assets/                         # 静的ファイル
│
├── .claude/                            # Claude Code 設定
│   └── CLAUDE.md
├── .env.example
├── .gitignore
├── app.json
├── package.json
└── README.md
```

### feature ディレクトリの構成ルール

各機能は以下の構造で実装する。

```
featureX/
├── components/     # その機能専用の UI コンポーネント
├── hooks/          # その機能専用のカスタムフック
├── screens/        # 画面コンポーネント
└── constants.js    # 定数
```

## 機能要件

### サンドボックス（事前確認）

| 項目 | 内容 |
|------|------|
| 目的 | 正式提出前に AI 判定を試行し、リスクを確認・修正 |
| 制限 | 1人1日3回まで |
| データ保存 | なし（プライバシー保護） |
| 対象 | 全ユーザー |

入力項目:
- 提出先（プルダウン選択：企画管理部 / 広報部）
- 団体名（プルダウン選択）
- 企画名（プルダウン選択、団体に紐づく）
- 媒体種別（プルダウン選択）
- ファイル（画像/動画）

ファイルバリデーション（クライアント側）:
- josenai_media_specs の allowed_extensions でファイル形式を検証
- josenai_media_specs の max_file_size_mb でサイズ上限を検証
- バリデーション失敗時はアップロード前にエラー表示

### 正式提出

| 項目 | 内容 |
|------|------|
| 目的 | 情宣物を正式に提出し、審査を依頼 |
| 制限 | なし |
| データ保存 | Google Drive + Supabase Database |
| 対象 | 全ユーザー |

リスクレベル別フロー:

| リスクレベル | スコア | 動作 |
|-------------|--------|------|
| 低リスク | 0-10% | ワンタップで提出完了 |
| 中リスク | 11-50% | 警告表示、確認後提出 |
| 高リスク | 51-100% | 理由入力必須で提出 |

**免責表示**: AI判定結果の画面には以下の文言を表示する:
「この判定結果は AI による自動検出であり、法的助言ではありません。最終判断は審査者が行います。」

#### 自動承認フロー

管理者が `auto_approve_enabled = true` に設定している場合、AI 判定後に以下の条件を**すべて**満たす提出物は自動的に承認される。

| # | 条件 | 理由 |
|---|------|------|
| 1 | `auto_approve_enabled` = `true` | 機能が有効化されている |
| 2 | `ai_risk_score` IS NOT NULL | AI 判定がスキップされていない（スキップ時は信頼性なし） |
| 3 | `ai_risk_score` ≤ `auto_approve_threshold` | スコアが閾値以下 |

自動承認時のフロー:

```
提出実行
  → Google Drive アップロード
  → Gemini API 判定
  → ai_risk_score 算出
  → 自動承認判定:
      auto_approve_enabled = true
      AND ai_risk_score IS NOT NULL
      AND ai_risk_score ≤ auto_approve_threshold
  → [条件充足] status = 'approved', reviewed_at = NOW(), reviewed_by = NULL,
               reviewer_comment = 'システム自動承認: AIリスクスコア {score}% (閾値: {threshold}%)'
  → [条件不充足] status = 'pending'（従来通り手動審査キューへ）
```

自動承認時のデータ:

| カラム | 値 | 備考 |
|--------|-----|------|
| status | `approved` | 即座に承認済み |
| reviewed_at | 提出時刻（`NOW()`） | AI判定直後 |
| reviewed_by | `NULL` | 人間の審査者なし（自動承認の識別に使用） |
| reviewer_comment | `システム自動承認: AIリスクスコア {score}% (閾値: {threshold}%)` | 自動承認の根拠を記録 |

> **免責表示（自動承認時）**: 自動承認された提出物の画面には「この提出物は AI リスクスコアに基づき自動承認されました。自動承認の判定精度について、システム開発者および AI サービス提供者は責任を負いません。」と表示する。

### AI 判定エラー時のフォールバック

| 条件 | 動作 |
|------|------|
| 30秒タイムアウト | 「AI判定をスキップ」ボタンを表示 |
| Gemini API エラー | 「AI判定をスキップ」ボタンを表示 |

スキップ時の動作:
- ai_risk_score = NULL
- ai_risk_details = { "skipped": true, "reason": "timeout" or "api_error" }
- 手動審査キューに入る（管理者がダッシュボードで確認）

### 提出削除機能

| 条件 | 削除可否 |
|------|---------|
| status = 'pending' | ○ 削除可能 |
| status = 'approved' または 'rejected' | × 削除不可（審査開始後） |

削除時の動作:
- josenai_submissions テーブルから物理削除
- Google Drive のファイルも削除
- 削除後は提出履歴画面に戻る

### マスタ管理（CSV インポート）

| 項目 | 内容 |
|------|------|
| 目的 | 団体・企画のマスタデータを CSV で一括管理 |
| 機能 | CSV アップロード → DB に自動反映 → プルダウンに表示 |
| 対象 | 管理者のみ |

CSV フォーマット（団体）:
```csv
organization_code,organization_name,category
ORG001,文化会演劇部,文化会
ORG002,軽音楽部,文化会
ORG003,写真部,文化会
```

CSV フォーマット（企画）:
```csv
project_code,project_name,organization_code
PRJ001,秋公演,ORG001
PRJ002,ライブイベント,ORG002
PRJ003,写真展,ORG003
```

特記事項:
- CSV アップロード時、同一コードの既存レコードは上書き（UPSERT）される
- CSV に含まれないコードの既存レコードは変更されない（残存）
- プルダウンは DB から動的に取得される
- 団体を選択すると、紐づく企画のみがプルダウンに表示される

エラーハンドリング:
- 不正フォーマット: パースエラーを表示し、インポートを中止
- 重複コード: 同一 organization_code / project_code は上書き（UPSERT）
- 参照整合性: 企画が参照する団体が存在しない場合はエラー表示
- トランザクション: インポートは1トランザクションで実行（途中失敗時は全件ロールバック）

## 画面設計

### 共通レイアウト

PC（768px以上）
```
┌─────────────────────────────────────────────────┐
│ ┌───────────┐ ┌─────────────────────────────┐ │
│ │           │ │ ヘッダー                    │ │
│ │ サイドバー │ ├─────────────────────────────┤ │
│ │           │ │                             │ │
│ │ サンドボックス│ │       コンテンツエリア       │ │
│ │ 提出       │ │                             │ │
│ │ 提出履歴   │ │                             │ │
│ │ ────────  │ │                             │ │
│ │ ダッシュボード│ │                             │ │
│ │ ルール管理 │ │                             │ │
│ │ マスタ管理 │ │                             │ │
│ │ 設定       │ │                             │ │
│ └───────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

スマホ（768px未満）
```
┌───────────────────────┐
│ ☰  ヘッダータイトル   │
├───────────────────────┤
│                       │
│   コンテンツエリア     │
│                       │
│                       │
└───────────────────────┘
```
※ ☰ タップでサイドバーがオーバーレイ表示

### サイドバー

- ヘッダー：「生駒祭 情宣AI」「2026」
- メニュー項目：サンドボックス、提出、提出履歴、（管理者のみ）ダッシュボード、ルール管理、マスタ管理、設定
- フッター：バージョン表示（v1.0.0）
- 背景色：ダークテーマ（#1a1a2e）

### サンドボックス画面

```
┌───────────────────────────────────────────────────────────┐
│ サンドボックス（事前確認）              残り: 2回/本日    │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  基本情報                                                 │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 提出先     [企画管理部                      ▼]     │   │
│  │ ─────────────────────────────────────────────────│   │
│  │ 団体名     [プルダウンで選択               ▼]     │   │
│  │ 企画名     [プルダウンで選択               ▼]     │   │
│  │ 媒体種別   [ポスター                       ▼]     │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ファイル                                                 │
│  ┌───────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │      クリックまたはドラッグでアップロード          │   │
│  │         JPG, PNG, MP4 / 最大100MB                 │   │
│  │                                                   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│                    [AI判定を実行]                         │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### マスタ管理画面（管理者）

```
┌───────────────────────────────────────────────────────────┐
│ マスタ管理                                                │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  団体マスタ                                               │
│  ┌───────────────────────────────────────────────────┐   │
│  │ [CSV ファイルを選択]  [インポート]                 │   │
│  │                                                   │   │
│  │ 現在の登録数: 50件                                │   │
│  │ 最終更新: 2026/08/01 10:30                        │   │
│  │                                                   │   │
│  │ | コード   | 団体名         | カテゴリ |          │   │
│  │ |---------|---------------|---------|           │   │
│  │ | ORG001  | 文化会演劇部   | 文化会   |          │   │
│  │ | ORG002  | 軽音楽部       | 文化会   |          │   │
│  │ | ...     | ...           | ...     |           │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  企画マスタ                                               │
│  ┌───────────────────────────────────────────────────┐   │
│  │ [CSV ファイルを選択]  [インポート]                 │   │
│  │                                                   │   │
│  │ 現在の登録数: 150件                               │   │
│  │ 最終更新: 2026/08/01 10:35                        │   │
│  │                                                   │   │
│  │ | コード   | 企画名         | 団体コード |        │   │
│  │ |---------|---------------|-----------|         │   │
│  │ | PRJ001  | 秋公演         | ORG001    |         │   │
│  │ | PRJ002  | ライブイベント | ORG002    |         │   │
│  │ | ...     | ...           | ...       |         │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 設定画面（管理者）

```
┌───────────────────────────────────────────────────────────┐
│ 設定                                                      │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  提出設定                                                 │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 提出受付          [ON]                             │   │
│  │ サンドボックス上限 [3  ] 回/日                      │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  AI 自動承認設定                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 自動承認           [OFF]                           │   │
│  │ ─────────────────────────────────────────────────│   │
│  │ 閾値（リスクスコア） [10 ] %以下を自動承認          │   │
│  │                                                   │   │
│  │ ⚠ 自動承認を有効にすると、閾値以下のリスクスコアの │   │
│  │ 提出物が審査者の確認なしに自動的に承認されます。   │   │
│  │ 自動承認された提出物に関する責任は管理者が負います。│   │
│  │ システム開発者・AI サービス提供者は責任を負いません。│   │
│  └───────────────────────────────────────────────────┘   │
│  ※ 自動承認を ON にする際、免責確認モーダルが表示される   │
│                                                           │
│  AI 設定                                                  │
│  ┌───────────────────────────────────────────────────┐   │
│  │ AI判定タイムアウト  [30 ] 秒                       │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  パスワード変更                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ [広報部パスワード変更]                              │   │
│  │ [企画管理部パスワード変更]                          │   │
│  │ [管理者パスワード変更]                              │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## エラーハンドリング設計

### Error Boundary アーキテクチャ

各画面は Error Boundary でラップされており、個別の画面でエラーが発生しても他の画面に影響を与えない。

構成:
```
DrawerNavigator
└── ScreenErrorBoundary（画面ごと）
    └── XxxScreen
        └── コンテンツ
```

| コンポーネント | 役割 |
|--------------|------|
| ScreenErrorBoundary | 画面単位のエラーを捕捉し、フォールバック UI を表示 |
| PlaceholderContent | 開発中画面およびエラー時のフォールバック表示 |

動作フロー:
1. 正常時: 各画面が正常に表示
2. エラー発生時: ScreenErrorBoundary がエラーを捕捉
3. フォールバック: PlaceholderContent をエラーモードで表示
4. リトライ:「ホームに戻る」ボタンでサンドボックス画面に遷移可能

エラーログ:

エラー発生時、以下の情報がコンソールに出力される。
- 画面名（screenName）
- エラーメッセージ
- コンポーネントスタック
- タイムスタンプ

## 認証・権限管理設計

### 認証方式

- Email/Password 認証
- 共有 Supabase プロジェクトの認証基盤（Auth）を使用
- @kindai.ac.jp ドメインのみ許可

### ユーザー種別

| 種別 | 認証方法 | 提出 | koho審査 | kikaku審査 | 設定管理 |
|------|---------|------|---------|---------|---------|
| 一般ユーザー（出展団体） | Email/Password | ○（自分のみ） | - | - | - |
| 広報部 | Email/Password + ロール | ○ | ○ | - | - |
| 企画管理部 | Email/Password + ロール | ○ | - | ○ | - |
| 管理者 | Email/Password + ロール | ○ | ○ | ○ | ○ |

### 管理者認証

- ログイン後にパスワード入力モーダルを表示
- パスワード一致で管理者モードにアクセス可能
- パスワードは bcrypt でハッシュ化して josenai_app_settings テーブルに保存（ソルト付き、コストファクター 10）
- 管理者権限は共有RBACの `roles` テーブルの screen 権限で閲覧・更新範囲を制御
- ブラウザを閉じるとセッションがリセットされ、次回ログイン時に再度パスワード入力モーダルを表示（UX 上の再確認）
- パスワード認証成功 → セッション中の権限状態をクライアント側で保持

### ユーザー登録フロー

共有プロジェクトには auth.users の自動作成トリガーがないため、アプリ側（AuthContext）で初回ログイン時に以下を実行:
1. `user_profiles` に upsert（共有システムとの統合用）
2. `josenai_profiles` に upsert（情宣固有データ用: sandbox_count 等）

### ログインフロー

```
1. ログイン画面表示（ログイン / 新規登録 タブ）
   ↓
2. メールアドレスとパスワードを入力
   ↓
3. Email/Password 認証（@kindai.ac.jp ドメインのみ）
   ↓
4. 初回ログイン → user_profiles + josenai_profiles を upsert
   ↓
5. 管理者パスワード入力モーダル表示
   ↓
6. 選択肢:
   - [スキップ] → 一般ユーザーとしてアクセス
   - [広報部] → 広報部パスワード入力 → josenai_review_koho 権限
   - [企画管理部] → 企画管理部パスワード入力 → josenai_review_kikaku 権限
   - [管理者] → 管理者パスワード入力 → 全 screen 権限（josenai_admin 含む）
   ↓
7. サンドボックス画面へ遷移
```

エラーハンドリング:
- 認証失敗: エラーメッセージを表示し、再試行を促す
- ドメイン不一致:「@kindai.ac.jp のメールアドレスでログインしてください」

## 自動承認機能の免責事項

### 責任の帰属

自動承認機能を有効化した場合、自動承認された提出物に関する一切の責任は、機能を有効化した管理者およびその所属組織（大学祭実行委員会）が負うものとする。以下の当事者は、自動承認の結果について責任を負わない:

- **システム開発者**: 本システムの設計・実装を行った開発者
- **AI サービス提供者**: Gemini API を提供する Google LLC
- **ホスティング提供者**: Supabase Inc.

### AI 判定の限界

AI によるリスクスコア算出は確率的な推論に基づいており、以下の限界がある:

- 判定精度は 100% ではなく、偽陰性（リスクを見逃す）・偽陽性（過剰検出）が発生しうる
- 新たな違反パターンやルール変更に即座に対応できない場合がある
- 画像・動画の文脈理解には限界があり、人間の審査者と異なる判断をする場合がある

### 最終確認の推奨

自動承認機能を利用する場合でも、管理者は以下を推奨される:

- 自動承認された提出物を定期的にサンプリング確認する
- 祭り当日など高リスク期間は閾値を下げるか、自動承認を無効化する
- 自動承認された提出物に問題が発見された場合、速やかに `status = 'rejected'` に変更する

### 閾値設定の推奨

| 閾値 | 推奨シーン | 自動承認される範囲 |
|------|-----------|-------------------|
| 5% | 厳格運用 | ほぼ完全に問題のない提出物のみ |
| 10%（デフォルト） | 標準運用 | 低リスク帯（フォーマット軽微指摘のみ）|
| 20% | 緩和運用 | フォーマット指摘数件まで許容 |
| 50% | 大量処理優先 | 禁止事項該当以外はほぼ自動承認 |

### UI 上の免責表示文言

自動承認を有効化する際の確認モーダルに以下の文言を表示する:

> **自動承認機能の有効化に関する確認**
>
> 自動承認機能を有効にすると、AI リスクスコアが設定した閾値以下の提出物は、人間の審査者による確認なしに自動的に承認されます。
>
> AI の判定は参考情報であり、判定精度は保証されません。自動承認された提出物に起因する問題について、システム開発者および AI サービス提供者（Google LLC）は一切の責任を負いません。
>
> 自動承認された提出物に関する責任は、本機能を有効化した管理者およびその所属組織が負うものとします。
>
> 上記を理解し、自動承認機能を有効化しますか？

## データベース設計

### テーブル構成

生駒祭統合管理の共有 Supabase プロジェクト（`qlldsvpkcfftbibujltf`）上に構築する。共有プロジェクトには 31 既存テーブル（整理券・警備・鍵管理・サポートチケット等）が稼働中。

#### 共有プロジェクトの認可基盤

```
auth.users (Supabase Auth)
    ↓ user_id
user_profiles (共有ユーザー情報)
    ↓ user_id
user_roles (多対多)
    ↓ role_id
roles (30ロール, permissions->'screens' で画面アクセス制御)
```

- 中核関数: `fn_has_screen_access(screen_name TEXT)` — ユーザーのロールに指定 screen が含まれるかチェック
- テーブル命名規則: 情宣固有テーブルは全て `josenai_` プレフィックスを付与

#### 情宣用 screen 識別子

| screen | 意味 | 付与先ロール |
|--------|------|-------------|
| `josenai_review_koho` | 広報部提出物(koho)の審査 | 広報部, 管理者 |
| `josenai_review_kikaku` | 企画管理部提出物(kikaku)の審査 | 企画管理部, 管理者 |
| `josenai_admin` | 全機能管理（設定・マスタ管理） | 管理者 |

#### 認可ヘルパー関数

| 関数名 | 判定内容 |
|--------|---------|
| `fn_is_josenai_koho()` | `fn_has_screen_access('josenai_review_koho')` |
| `fn_is_josenai_kikaku()` | `fn_has_screen_access('josenai_review_kikaku')` |
| `fn_is_josenai_admin()` | `fn_has_screen_access('josenai_admin')` |
| `fn_is_josenai_reviewer()` | koho OR kikaku OR admin のいずれか |

### 1. user_profiles テーブル（共有・参照のみ）

共有プロジェクトの既存テーブル。情宣システムからは参照のみ。初回ログイン時にアプリ側で upsert する。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key (gen_random_uuid()) |
| user_id | UUID | NOT NULL | auth.users.id（UNIQUE） |
| name | TEXT | NULL | ユーザー名 |
| organization | TEXT | NULL | 所属組織（テキスト） |
| theme_mode | TEXT | NULL | テーマ設定 |
| password_changed_at | TIMESTAMPTZ | NULL | パスワード変更日時 |
| created_at | TIMESTAMPTZ | NOT NULL | 作成日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

### 2. josenai_profiles テーブル（情宣固有）

情宣システム固有のユーザーデータ。サンドボックス利用制限を管理する。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key (gen_random_uuid()) |
| user_id | UUID | NOT NULL | Foreign Key → auth.users(id)（UNIQUE） |
| sandbox_count_today | INTEGER | NOT NULL | 本日のサンドボックス使用回数（デフォルト: 0） |
| sandbox_count_date | DATE | NULL | サンドボックスカウント日付（JST 0:00 リセット） |
| created_at | TIMESTAMPTZ | NOT NULL | 作成日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

※ FK を `user_profiles.user_id` ではなく `auth.users.id` に直接張る。理由: 外部ユーザー（出展団体）は共有 user_profiles にレコードが存在しない可能性がある。

### 3. josenai_organizations テーブル（団体マスタ）

CSV インポートで管理される団体マスタ。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key |
| organization_code | TEXT | NOT NULL | 団体コード（UNIQUE） |
| organization_name | TEXT | NOT NULL | 団体名 |
| category | TEXT | NULL | カテゴリ（文化会、体育会など） |
| is_active | BOOLEAN | NOT NULL | 有効フラグ（デフォルト: true） |
| created_at | TIMESTAMPTZ | NOT NULL | 作成日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

インデックス:
- organization_code に UNIQUE インデックス
- is_active の部分インデックス

### 4. josenai_projects テーブル（企画マスタ）

CSV インポートで管理される企画マスタ。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key |
| project_code | TEXT | NOT NULL | 企画コード（UNIQUE） |
| project_name | TEXT | NOT NULL | 企画名 |
| organization_id | UUID | NOT NULL | Foreign Key → josenai_organizations.id |
| is_active | BOOLEAN | NOT NULL | 有効フラグ（デフォルト: true） |
| created_at | TIMESTAMPTZ | NOT NULL | 作成日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

インデックス:
- project_code に UNIQUE インデックス
- organization_id にインデックス
- is_active の部分インデックス

### 5. josenai_submissions テーブル

提出情報を保存する。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key |
| user_id | UUID | NOT NULL | Foreign Key → auth.users(id) |
| organization_id | UUID | NOT NULL | Foreign Key → josenai_organizations.id |
| project_id | UUID | NOT NULL | Foreign Key → josenai_projects.id |
| submission_type | TEXT | NOT NULL | 提出先部局（kikaku=企画管理部 / koho=広報部） |
| media_type | TEXT | NOT NULL | 媒体種別 |
| file_name | TEXT | NOT NULL | 元ファイル名 |
| file_size_bytes | BIGINT | NOT NULL | ファイルサイズ |
| drive_file_id | TEXT | NULL | Google Drive ファイル ID |
| drive_file_url | TEXT | NULL | Google Drive 共有 URL |
| ai_risk_score | INTEGER | NULL | リスクスコア（0-100） |
| ai_risk_details | JSONB | NULL | AI 指摘内容 |
| status | TEXT | NOT NULL | ステータス（pending/approved/rejected） |
| user_comment | TEXT | NULL | 提出者コメント |
| reviewer_comment | TEXT | NULL | 審査者コメント |
| reviewed_at | TIMESTAMPTZ | NULL | 審査日時 |
| reviewed_by | UUID | NULL | 審査者 ID（Foreign Key → auth.users(id)） |
| version | INTEGER | NOT NULL | 楽観的ロック用バージョン（デフォルト: 1、更新時インクリメント） |
| created_at | TIMESTAMPTZ | NOT NULL | 提出日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

submission_type の値:
- `kikaku`: 企画管理部宛（企画で制作した情宣素材）
- `koho`: 広報部宛（SNS用画像・動画）

### 6. josenai_media_specs テーブル

メディア規格マスタ。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key |
| media_type | TEXT | NOT NULL | 媒体種別（UNIQUE） |
| display_name | TEXT | NOT NULL | 表示名 |
| allowed_extensions | TEXT[] | NOT NULL | 許可拡張子 |
| max_file_size_mb | INTEGER | NOT NULL | 最大サイズ(MB) |
| is_active | BOOLEAN | NOT NULL | 有効フラグ |
| created_at | TIMESTAMPTZ | NOT NULL | 作成日時 |

### 7. josenai_app_settings テーブル

アプリ設定（キーバリュー形式）。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| key | TEXT | NOT NULL | Primary Key |
| value | TEXT | NOT NULL | 設定値 |
| description | TEXT | NULL | 説明 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

設定キー一覧:

| key | 説明 | 例 |
|-----|------|-----|
| koho_admin_password_hash | 広報部管理者パスワード(bcrypt) | $2b$10$... |
| kikaku_admin_password_hash | 企画管理部管理者パスワード(bcrypt) | $2b$10$... |
| super_admin_password_hash | スーパー管理者パスワード(bcrypt) | $2b$10$... |
| sandbox_daily_limit | サンドボックス1日上限 | 3 |
| submission_enabled | 提出受付中 | true |
| ai_timeout_seconds | AI判定タイムアウト秒数 | 30 |
| auto_approve_enabled | 自動承認機能の有効/無効 | false |
| auto_approve_threshold | 自動承認閾値（この値以下のスコアを自動承認、0-100 整数） | 10 |
| app_version | アプリケーションバージョン | 1.0.0 |

> **注意**: `auto_approve_enabled` を `true` に変更する際は、設定画面の免責確認モーダルで管理者が責任を了承する必要がある。`auto_approve_threshold` は `auto_approve_enabled = true` の場合のみ効果を持つ。

### 8. josenai_check_items テーブル

AI 判定で使用するチェック項目マスタ。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key |
| category | TEXT | NOT NULL | カテゴリ（prohibited/copyright/format） |
| item_code | TEXT | NOT NULL | 項目コード（UNIQUE） |
| item_name | TEXT | NOT NULL | 項目名 |
| description | TEXT | NULL | 詳細説明 |
| risk_weight | INTEGER | NOT NULL | リスク重み（5/15/30） |
| is_active | BOOLEAN | NOT NULL | 有効フラグ |
| display_order | INTEGER | NOT NULL | 表示順 |
| created_at | TIMESTAMPTZ | NOT NULL | 作成日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

カテゴリ別リスク重み:
- prohibited（禁止事項）: 30点 - 重大な違反
- copyright（著作権）: 15点 - 中程度の懸念
- format（フォーマット）: 5点 - 軽微な指摘

### 9. josenai_rule_documents テーブル

情宣ルール・ガイドライン文書マスタ。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key |
| document_type | TEXT | NOT NULL | 文書種別 |
| title | TEXT | NOT NULL | タイトル |
| content | TEXT | NOT NULL | 本文（Markdown） |
| version | INTEGER | NOT NULL | バージョン番号 |
| is_active | BOOLEAN | NOT NULL | 有効フラグ |
| created_at | TIMESTAMPTZ | NOT NULL | 作成日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

文書種別:
- josenai_rule: 情宣ルール
- copyright_guideline: 著作物取り扱いガイドライン
- submission_guide: 提出ガイド

### テーブルリレーション

```
auth.users (Supabase共有認証)
    ├── 1:1 → user_profiles (共有: 名前・所属)
    │           ↓ 1:N
    │         user_roles → roles (共有RBAC: screen権限)
    │
    ├── 1:1 → josenai_profiles (情宣固有: sandbox制限)
    │
    └── 1:N → josenai_submissions ──→ josenai_check_items (参照: AI判定時)
                  ↓ N:1
              josenai_organizations ←─── josenai_projects (N:1)

josenai_rule_documents (独立マスタ: ルール管理画面で編集)
josenai_check_items (独立マスタ: AI判定基準)
josenai_media_specs (独立マスタ: 媒体種別)
josenai_app_settings (独立マスタ: システム設定)
```

### Row Level Security (RLS) ポリシー

Supabase の RLS 機能を使用し、全情宣テーブルでRLSを有効化する。認可チェックには共有RBACの `fn_has_screen_access()` をラップしたヘルパー関数を使用する。

josenai_profiles テーブル:
- SELECT: `auth.uid() = user_id`（本人のみ）
- INSERT: `auth.uid() = user_id`（本人のみ）
- UPDATE: `auth.uid() = user_id`（本人のみ）

josenai_organizations / josenai_projects テーブル:
- SELECT: `TRUE`（全認証ユーザー閲覧可能）
- INSERT/UPDATE/DELETE: `fn_is_josenai_admin()`（管理者のみ）

josenai_submissions テーブル:
- SELECT: 以下の条件で閲覧可能（RLS で制御、OR 条件）
  - 一般ユーザー: 自分の提出のみ（`user_id = auth.uid()`）
  - 広報部: koho 提出のみ（`fn_is_josenai_koho() AND submission_type = 'koho'`）
  - 企画管理部: kikaku 提出のみ（`fn_is_josenai_kikaku() AND submission_type = 'kikaku'`）
  - 管理者: 全件閲覧可能（`fn_is_josenai_admin()`）
  - 過去の審査者: 自分が審査した提出物（`reviewed_by = auth.uid()`）※監査証跡
- INSERT: `auth.uid() IS NOT NULL AND user_id = auth.uid()`
- UPDATE: 担当範囲の審査権限のみ
  - 広報部: koho 提出のみ更新可能（`fn_is_josenai_koho() AND submission_type = 'koho'`）
  - 企画管理部: kikaku 提出のみ更新可能（`fn_is_josenai_kikaku() AND submission_type = 'kikaku'`）
  - 管理者: 全件更新可能（`fn_is_josenai_admin()`）
- DELETE: `user_id = auth.uid() AND status = 'pending'`（本人のpendingのみ）

josenai_media_specs / josenai_check_items テーブル:
- SELECT: `TRUE`（全認証ユーザー閲覧可能）

josenai_rule_documents テーブル:
- SELECT: `TRUE`（全認証ユーザー閲覧可能）
- UPDATE: `fn_is_josenai_reviewer()`（審査権限保持者）

josenai_app_settings テーブル:
- SELECT: パスワード系キーは `fn_is_josenai_reviewer()` 以上、その他は全員
- UPDATE: `fn_is_josenai_admin()`（管理者のみ）

## API 設計

### Google Drive API

#### 概要・方針

- Google Drive REST API v3 を直接呼び出す（`googleapis` npm パッケージは Edge Functions のデプロイサイズ上限に不適切）
- サービスアカウント認証（ユーザー認証とは独立）
- Edge Function `submit` から `_shared/driveClient.ts` 経由で利用

#### 認証フロー

```
GOOGLE_DRIVE_SERVICE_ACCOUNT (Secrets)
  → JWT 生成 (RS256 署名, iss=client_email, scope=drive.file)
  → POST https://oauth2.googleapis.com/token
    grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion={JWT}
  → アクセストークン取得 (有効期限1時間, 期限5分前に自動再取得)
```

- OAuth スコープ: `https://www.googleapis.com/auth/drive.file`
- `drive.file` スコープ = アプリが作成したファイルのみ操作可能（最小権限の原則）

#### API エンドポイント一覧

| 操作 | メソッド | エンドポイント |
|------|---------|---------------|
| トークン取得 | POST | `https://oauth2.googleapis.com/token` |
| ファイルアップロード | POST | `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart` |
| フォルダ作成 | POST | `https://www.googleapis.com/drive/v3/files` |
| ファイル検索 | GET | `https://www.googleapis.com/drive/v3/files?q=...` |
| ファイル削除 | DELETE | `https://www.googleapis.com/drive/v3/files/{fileId}` |
| 権限追加（共有） | POST | `https://www.googleapis.com/drive/v3/files/{fileId}/permissions` |
| メタデータ取得 | GET | `https://www.googleapis.com/drive/v3/files/{fileId}?fields=webViewLink` |

#### ファイルアップロードフロー

```
Client (FormData)
  → Edge Function (submit)
    → driveClient.ensureFolder(path)     … フォルダ自動作成
    → driveClient.uploadFile(file, name, folderId)  … multipart/related アップロード
    → driveClient.shareFile(fileId)      … 閲覧用共有URL生成
    → DB INSERT (drive_file_id, drive_file_url)
  → Response to Client
```

- `multipart/related` 形式でメタデータ（JSON）+ ファイル本体を一括送信
- Edge Function メモリ 150MB 以内で処理（josenai_media_specs の max_file_size_mb 上限 100MB に対応可）

#### フォルダ自動作成

パス `/生駒祭2026/{企画物|SNS}/{団体名}/` をセグメント分割し、各階層で存在確認→未存在なら作成:

```
検索クエリ:
  mimeType='application/vnd.google-apps.folder'
  AND name='{セグメント名}'
  AND '{parentId}' in parents
  AND trashed=false
```

- ルートフォルダ ID は `GOOGLE_DRIVE_ROOT_FOLDER_ID` として Secrets に設定
- 作成済みフォルダは Edge Function 実行中にメモリ内キャッシュ

#### 共有 URL 生成

ファイルアップロード後に `permissions` API で閲覧権限を付与:

```http
POST /drive/v3/files/{fileId}/permissions
```

```json
{ "role": "reader", "type": "anyone" }
```

- レスポンスから `webViewLink` を取得し、`josenai_submissions.drive_file_url` に保存
- サービスアカウントが作成したファイルはデフォルトで非公開のため、この手順が必須

#### ファイル削除

- `DELETE /drive/v3/files/{fileId}` で即座にファイルを完全削除（ゴミ箱を経由しない）
- 提出削除時: DB レコード削除と Google Drive ファイル削除を同時実行
- DB 削除成功・Drive 削除失敗の場合はログ記録のみ（孤立ファイルは管理者が手動削除）

#### エラーハンドリング

| エラー | HTTP ステータス | 対応 |
|--------|----------------|------|
| 認証失敗 | 401 | JWT 再生成→アクセストークン再取得→リトライ1回 |
| レート制限 | 429 | 指数バックオフ（1s, 2s, 4s）で最大3回リトライ |
| フォルダ作成失敗 | 4xx/5xx | トランザクション全体をロールバック、エラー返却 |
| アップロード失敗 | 4xx/5xx | エラー表示、ユーザーに再試行を促す |
| 削除失敗 | 4xx/5xx | ログ記録、管理者に手動削除を通知 |

#### Edge Function 制約

| 項目 | 値 | 備考 |
|------|----|------|
| メモリ上限 | 150MB | 100MB ファイル処理時は残り約 50MB |
| 実行時間 (Free) | 150秒 | アップロード＋AI判定の合計時間に注意 |
| 実行時間 (Pro) | 400秒 | 大容量動画アップロード時に余裕あり |
| リクエストボディ | 明示的制限なし | メモリ上限内で処理する前提 |
| デプロイサイズ | 10MB | googleapis パッケージ不使用の理由 |

### Supabase API

認証関連 API:

| 機能 | メソッド | 説明 |
|------|---------|------|
| ログイン | supabase.auth.signInWithPassword() | Email/Password でログイン |
| 新規登録 | supabase.auth.signUp() | Email/Password で新規登録 |
| ログアウト | supabase.auth.signOut() | ログアウト |
| セッション取得 | supabase.auth.getSession() | 現在のセッション情報を取得 |

マスタデータ取得 API:

| 機能 | メソッド | 説明 |
|------|---------|------|
| 団体一覧取得 | supabase.from('josenai_organizations').select() | プルダウン用の団体一覧 |
| 企画一覧取得 | supabase.from('josenai_projects').select() | プルダウン用の企画一覧（団体でフィルタ可） |
| 媒体種別取得 | supabase.from('josenai_media_specs').select() | プルダウン用の媒体種別一覧 |

### Supabase Edge Functions

| エンドポイント | メソッド | 認証 | 説明 |
|---------------|---------|------|------|
| /functions/v1/sandbox | POST | 必要 | サンドボックス AI 判定 |
| /functions/v1/submit | POST | 必要 | 正式提出（自動承認判定を含む） |
| /functions/v1/review | POST | 管理者 | 審査（承認/却下） |
| /functions/v1/import-organizations | POST | 管理者 | 団体 CSV インポート |
| /functions/v1/import-projects | POST | 管理者 | 企画 CSV インポート |

#### submit Edge Function — 自動承認ロジック

DB INSERT 直後、レスポンス返却前に以下を実行する:

```typescript
// 自動承認判定（submit Edge Function 内）
const settings = await supabase
  .from('josenai_app_settings')
  .select('key, value')
  .in('key', ['auto_approve_enabled', 'auto_approve_threshold']);

const autoEnabled = settings.find(s => s.key === 'auto_approve_enabled')?.value === 'true';
const threshold = parseInt(settings.find(s => s.key === 'auto_approve_threshold')?.value ?? '10');

if (autoEnabled && ai_risk_score !== null && ai_risk_score <= threshold) {
  await supabase
    .from('josenai_submissions')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: null,
      reviewer_comment: `システム自動承認: AIリスクスコア ${ai_risk_score}% (閾値: ${threshold}%)`,
    })
    .eq('id', submission.id);
}
```

レスポンス形式:

```json
{
  "success": true,
  "submission_id": "uuid",
  "ai_risk_score": 5,
  "auto_approved": true
}
```

- `auto_approved`: 自動承認が実行された場合 `true`、それ以外は `false`
- フロントエンドは `auto_approved = true` 時に「自動承認されました」のトースト通知を表示する

### CSV インポート API

Edge Functions で実装する。フロントエンドは CSV ファイルを multipart/form-data で Edge Function に送信する。

```javascript
// フロントエンドからの呼び出し
const importCsv = async (file, type) => {
  const formData = new FormData();
  formData.append('file', file);

  const endpoint = type === 'josenai_organizations'
    ? 'import-organizations'
    : 'import-projects';

  const { data, error } = await supabase.functions.invoke(endpoint, {
    body: formData,
  });

  return data; // { success: boolean, count: number }
};
```

Edge Function 側の処理:
1. CSV をパース（バリデーション）
2. UPSERT でデータを反映（1トランザクション）
3. 結果を返す

## 依存パッケージ

### 主要パッケージ

| パッケージ | 用途 |
|-----------|------|
| expo | React Native 開発フレームワーク |
| react-native-web | Web 対応 |
| @react-navigation/native | ナビゲーション基盤 |
| @react-navigation/drawer | サイドバーナビゲーション |
| react-native-gesture-handler | ジェスチャー操作 |
| react-native-reanimated | アニメーション |
| @supabase/supabase-js | Supabase クライアント |
| papaparse | CSV パース |

## 起動方法

### 開発サーバー起動

```bash
# Web版
pnpm run web

# または
pnpm exec expo start --web
```

### アクセス

ブラウザで http://localhost:8081 を開く。

## Clarifications

### Session 2026-01-25

- Q: 管理者権限の永続化方針 → A: 共有RBACの roles テーブルの screen 権限で制御（セッション開始時に再認証モーダル表示は維持）
- Q: パスワードハッシュ方式 → A: bcrypt（ソルト付き、コストファクター 10）
- Q: 楽観的ロック実装方式 → A: josenai_submissions.version カラム追加（更新時インクリメント）
- Q: サンドボックス画面に「提出先」選択 → A: 追加する（提出種別により判定基準が異なる場合に対応）
- Q: RLS ポリシーの管理者権限詳細 → A: fn_is_josenai_*() ヘルパー関数で制御（koho は koho提出のみ、kikaku は kikaku提出のみ、admin は全件）
- Q: 管理者権限取り消し時の動作 → A: 過去に審査した提出物は引き続き閲覧可能（監査証跡、reviewed_by カラム追加）
- Q: Gemini API利用不可時の動作 → A: AIスキップオプションを表示し、手動審査キューに入れる
- Q: AI判定処理の最大許容時間 → A: 30秒
- Q: Google Driveアップロード失敗時 → A: ロールバックしてエラー表示、再試行を促す
- Q: サンドボックス制限リセット → A: JST 0:00（日本時間の深夜）
- Q: 審査結果の通知方法 → A: アプリ内通知のみ
- Q: 同一組み合わせでの複数回提出 → A: 可能（新規提出として追加、過去の提出も履歴に残る）
- Q: 提出後の削除・編集 → A: pending状態のみ削除可能（審査開始後は不可）
- Q: Google Driveフォルダ構成 → A: 提出種別・団体別フォルダ（/生駒祭2026/企画物/{団体}/ or /生駒祭2026/SNS/{団体}/）
- Q: 複数管理者の同時審査 → A: 楽観的ロック（後から保存した人に競合警告、再読み込みを促す）
- Q: check_items/rule_documentsテーブルの仕様書追記 → A: はい、仕様書に追記する
- Q: デュアル提出先対応 → A: 企画物（企画管理部審査）とSNS（広報部審査）の2種類
- Q: 提出先選択フロー → A: フォーム内でプルダウン選択
- Q: SNS提出時の団体・企画選択 → A: 必須（紐づけ必要）
- Q: SNS提出者 → A: 企画団体も広報部も提出可能
- Q: 管理者権限構造 → A: 部署別管理者（koho/kikaku）+ スーパー管理者（super）

### Session 2026-02-10

- Q: 共有Supabaseプロジェクトへの移行 → A: josenai_ プレフィックス付きテーブルで共存（31既存テーブルとの衝突回避）
- Q: ユーザー連携方式 → A: user_profiles（共有）+ josenai_profiles（情宣固有）の拡張テーブル方式
- Q: 管理者権限方式 → A: 共有RBACのscreen-based認可に統合（josenai_admin_rolesテーブル不要）
- Q: 提出先分類 → A: 'project'/'sns' から 'kikaku'/'koho'（部局名ベース）に変更
- Q: 広報部ロール → A: 共有rolesテーブルに手動追加済み
- Q: ユーザー登録フロー → A: AuthContextで初回ログイン時にuser_profiles + josenai_profiles を upsert
- Q: 認可ヘルパー関数 → A: fn_is_josenai_koho/kikaku/admin/reviewer の4関数を作成

## ライセンス

MIT License
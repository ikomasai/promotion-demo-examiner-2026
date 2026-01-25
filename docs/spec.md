# プロジェクト仕様書

## プロジェクト概要

生駒祭 2026 で使用する情宣物（ポスター、ビラ、デジタルサイネージ用画像・動画等）および SNS 用宣伝素材が、大学祭実行委員会の定める「情宣ルール」および「著作物取り扱いガイドライン」に適合しているかを AI が自動判定し、審査業務を効率化するシステム。

### 提出種別と審査部署

| 提出種別 | 内容 | 審査部署 | Google Drive 保存先 |
|---------|------|----------|-------------------|
| 企画物 | ポスター、ビラ、サイネージ等 | 企画管理部 | `/生駒祭2026/企画物/{団体名}/` |
| SNS | Twitter/Instagram 用画像・動画 | 広報部 | `/生駒祭2026/SNS/{団体名}/` |

Web アプリケーション（PWA）として動作し、PC とスマートフォンの両方に対応する。

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React Native (Expo) Web |
| ホスティング | GitHub Pages |
| バックエンド | Supabase (Auth, Database, Edge Functions) |
| ファイル保存 | Google Drive（API 経由） |
| AI | Gemini API (gemini-2.5-flash-lite) |
| 使用言語 | JavaScript（TypeScript ではない） |

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
| 2 | 提出 | 全員 | 企画物 or SNS を選択して正式提出 |
| 3 | 提出履歴 | 全員 | 自分の提出履歴を確認 |
| 4 | ダッシュボード | 管理者 | 担当範囲の提出一覧・審査 |
| 5 | ルール管理 | 管理者 | 情宣ルール・ガイドラインの編集 |
| 6 | マスタ管理 | スーパー管理者 | 団体・企画の CSV インポート |
| 7 | 設定 | スーパー管理者 | システム設定 |

### 管理者権限構造

| 管理者種別 | admin_role | ダッシュボード閲覧範囲 | マスタ管理 | 設定 |
|-----------|------------|---------------------|-----------|------|
| 広報部管理者 | koho | SNS提出のみ | × | × |
| 企画管理部管理者 | kikaku | 企画物のみ | × | × |
| スーパー管理者 | super | 全て（フィルタ切替可） | ○ | ○ |

## ディレクトリ構造

```
project-root/
├── docs/                               # ドキュメント
│   ├── プロジェクト仕様書.md
│   ├── 開発ルール.md
│   └── AI用プロンプト/
│       └── README.md
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
│   │   └── _shared/
│   │       ├── supabase.ts
│   │       ├── driveClient.ts
│   │       └── geminiClient.ts
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── config.toml
│
├── src/
│   ├── features/                       # 機能ごとにまとめる
│   │   ├── auth/                       # 認証
│   │   │   ├── components/
│   │   │   │   ├── GoogleLoginButton.jsx
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
- 提出先（プルダウン選択：企画物 / SNS）
- 団体名（プルダウン選択）
- 企画名（プルダウン選択、団体に紐づく）
- 媒体種別（プルダウン選択）
- ファイル（画像/動画）

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
- submissions テーブルから物理削除
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
- CSV をアップロードすると、既存データを全て置き換える
- プルダウンは DB から動的に取得される
- 団体を選択すると、紐づく企画のみがプルダウンに表示される

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
│  │ 提出先     [企画物                         ▼]     │   │
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

- Google OAuth 認証
- Supabase の標準認証機能（Auth）を使用
- @kindai.ac.jp ドメインのみ許可

### ユーザー種別

| 種別 | 説明 | アクセス可能画面 |
|------|------|-----------------|
| 一般ユーザー | 企画提出者（学生） | サンドボックス、提出、提出履歴 |
| 管理者 | 広報部員 | 全画面 |

### 管理者認証

- ログイン後にパスワード入力モーダルを表示
- パスワード一致で管理者モードにアクセス可能
- パスワードは bcrypt でハッシュ化して app_settings テーブルに保存（ソルト付き、コストファクター 10）
- 管理者権限は profiles.admin_role に保存し、RLS で閲覧・更新範囲を制御
- ブラウザを閉じるとセッションがリセットされ、次回ログイン時に再度パスワード入力モーダルを表示（UX 上の再確認）
- パスワード認証成功時に profiles.admin_role を更新（スキップ時は NULL に設定）

### ログインフロー

```
1. ログイン画面表示
   ↓
2. [Googleでログイン] ボタンをクリック
   ↓
3. Google OAuth 認証（@kindai.ac.jp のみ）
   ↓
4. 認証成功 → 管理者パスワード入力モーダル表示
   ↓
5. 選択肢:
   - [スキップ] → 一般ユーザーとしてアクセス（admin_role = NULL）
   - [広報部] → 広報部パスワード入力 → admin_role = 'koho'
   - [企画管理部] → 企画管理部パスワード入力 → admin_role = 'kikaku'
   - [スーパー管理者] → スーパー管理者パスワード入力 → admin_role = 'super'
   ↓
6. サンドボックス画面へ遷移
```

エラーハンドリング:
- 認証失敗: エラーメッセージを表示し、再試行を促す
- ドメイン不一致:「@kindai.ac.jp のメールアドレスでログインしてください」

## データベース設計

### テーブル構成

Supabase を使用し、以下のテーブルを定義する。

### 1. profiles テーブル

ユーザーの詳細情報を保存する。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key（auth.users.id と連携） |
| email | TEXT | NOT NULL | メールアドレス |
| display_name | TEXT | NULL | 表示名 |
| admin_role | TEXT | NULL | 管理者権限（NULL/koho/kikaku/super） |
| sandbox_count_today | INTEGER | NOT NULL | 本日のサンドボックス使用回数 |
| sandbox_count_date | DATE | NULL | サンドボックスカウント日付 |
| created_at | TIMESTAMPTZ | NOT NULL | 作成日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

admin_role の値:
- `NULL`: 一般ユーザー
- `koho`: 広報部管理者（SNS提出のみ審査可能）
- `kikaku`: 企画管理部管理者（企画物のみ審査可能）
- `super`: スーパー管理者（全て審査可能 + マスタ管理 + 設定）

### 2. organizations テーブル（団体マスタ）

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

### 3. projects テーブル（企画マスタ）

CSV インポートで管理される企画マスタ。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key |
| project_code | TEXT | NOT NULL | 企画コード（UNIQUE） |
| project_name | TEXT | NOT NULL | 企画名 |
| organization_id | UUID | NOT NULL | Foreign Key → organizations.id |
| is_active | BOOLEAN | NOT NULL | 有効フラグ（デフォルト: true） |
| created_at | TIMESTAMPTZ | NOT NULL | 作成日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

インデックス:
- project_code に UNIQUE インデックス
- organization_id にインデックス

### 4. submissions テーブル

提出情報を保存する。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key |
| user_id | UUID | NOT NULL | Foreign Key → profiles.id |
| organization_id | UUID | NOT NULL | Foreign Key → organizations.id |
| project_id | UUID | NOT NULL | Foreign Key → projects.id |
| submission_type | TEXT | NOT NULL | 提出種別（project/sns） |
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
| reviewed_by | UUID | NULL | 審査者 ID（Foreign Key → profiles.id） |
| version | INTEGER | NOT NULL | 楽観的ロック用バージョン（デフォルト: 1、更新時インクリメント） |
| created_at | TIMESTAMPTZ | NOT NULL | 提出日時 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新日時 |

### 5. media_specs テーブル

メディア規格マスタ。

| カラム名 | 型 | Null | 説明 |
|---------|-----|------|------|
| id | UUID | NOT NULL | Primary Key |
| media_type | TEXT | NOT NULL | 媒体種別 |
| display_name | TEXT | NOT NULL | 表示名 |
| allowed_extensions | TEXT[] | NOT NULL | 許可拡張子 |
| max_file_size_mb | INTEGER | NOT NULL | 最大サイズ(MB) |
| is_active | BOOLEAN | NOT NULL | 有効フラグ |
| created_at | TIMESTAMPTZ | NOT NULL | 作成日時 |

### 6. app_settings テーブル

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

### 7. check_items テーブル

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

### 8. rule_documents テーブル

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
auth.users (Supabase管理)
    ↓ 1:1
profiles
    ↓ 1:N
submissions ──→ check_items (参照: AI判定時)
    ↓ N:1
organizations ←─── projects (N:1)

rule_documents (独立マスタ: ルール管理画面で編集)
check_items (独立マスタ: AI判定基準)
media_specs (独立マスタ: 媒体種別)
app_settings (独立マスタ: システム設定)
```

### Row Level Security (RLS) ポリシー

Supabase の RLS 機能を使用し、以下のポリシーを設定する。

profiles テーブル:
- SELECT: ログインユーザー本人のプロフィールのみ閲覧可能
- UPDATE: ログインユーザー本人のみ実行可能

organizations テーブル:
- SELECT: 全ユーザーが閲覧可能
- INSERT/UPDATE/DELETE: 管理者のみ実行可能

projects テーブル:
- SELECT: 全ユーザーが閲覧可能
- INSERT/UPDATE/DELETE: 管理者のみ実行可能

submissions テーブル:
- SELECT: 以下の条件で閲覧可能（RLS で制御、OR 条件）
  - 一般ユーザー: 自分の提出のみ（user_id = auth.uid()）
  - koho 管理者: SNS 提出のみ（submission_type = 'sns'）
  - kikaku 管理者: 企画物のみ（submission_type = 'project'）
  - super 管理者: 全件閲覧可能
  - 過去の審査者: 自分が審査した提出物（reviewed_by = auth.uid()）※監査証跡
- INSERT: ログインユーザーのみ実行可能
- UPDATE: 管理者のみ実行可能（審査）、担当範囲のみ
  - koho: SNS 提出のみ更新可能
  - kikaku: 企画物のみ更新可能
  - super: 全件更新可能

## API 設計

### Supabase API

認証関連 API:

| 機能 | メソッド | 説明 |
|------|---------|------|
| ログイン | supabase.auth.signInWithOAuth() | Google OAuth でログイン |
| ログアウト | supabase.auth.signOut() | ログアウト |
| セッション取得 | supabase.auth.getSession() | 現在のセッション情報を取得 |

マスタデータ取得 API:

| 機能 | メソッド | 説明 |
|------|---------|------|
| 団体一覧取得 | supabase.from('organizations').select() | プルダウン用の団体一覧 |
| 企画一覧取得 | supabase.from('projects').select() | プルダウン用の企画一覧（団体でフィルタ可） |
| 媒体種別取得 | supabase.from('media_specs').select() | プルダウン用の媒体種別一覧 |

### Supabase Edge Functions

| エンドポイント | メソッド | 認証 | 説明 |
|---------------|---------|------|------|
| /functions/v1/sandbox | POST | 必要 | サンドボックス AI 判定 |
| /functions/v1/submit | POST | 必要 | 正式提出 |
| /functions/v1/review | POST | 管理者 | 審査（承認/却下） |
| /functions/v1/import-organizations | POST | 管理者 | 団体 CSV インポート |
| /functions/v1/import-projects | POST | 管理者 | 企画 CSV インポート |

### CSV インポート API

フロントエンド側で実装する関数。

```javascript
/**
 * CSV ファイルをパースして DB にインポート
 * @param {File} file - CSV ファイル
 * @param {String} type - 'organizations' or 'projects'
 * @returns {Object} { success: boolean, count: number }
 */
const importCsv = async (file, type) => {
  // 1. CSV をパース
  const text = await file.text();
  const rows = parseCsv(text);
  
  // 2. 既存データを削除（または is_active = false に更新）
  // 3. 新しいデータを INSERT
  // 4. 結果を返す
};
```

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
npm run web

# または
npx expo start --web
```

### アクセス

ブラウザで http://localhost:8081 を開く。

## Clarifications

### Session 2026-01-25

- Q: 管理者権限 (admin_role) の永続化方針 → A: profiles.admin_role に保存し RLS で制御（セッション開始時に再認証モーダル表示は維持）
- Q: パスワードハッシュ方式 → A: bcrypt（ソルト付き、コストファクター 10）
- Q: 楽観的ロック実装方式 → A: submissions.version カラム追加（更新時インクリメント）
- Q: サンドボックス画面に「提出先」選択 → A: 追加する（提出種別により判定基準が異なる場合に対応）
- Q: RLS ポリシーの管理者権限詳細 → A: RLS で制御（koho は SNS のみ、kikaku は企画物のみ、super は全件）
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

## ライセンス

MIT License
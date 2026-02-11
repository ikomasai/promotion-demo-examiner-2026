# タスク一覧: 生駒祭 情宣AI判定システム

**入力**: `/docs/` 配下の設計ドキュメント
**前提**: spec.md（必須）

**テスト**: テストは明示的に要求されていないため省略

**構成**: タスクはユーザーストーリーごとにグループ化し、各ストーリーの独立した実装・テストを可能にする。

## 記法: `[ID] [P?] [ストーリー] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[ストーリー]**: タスクが属するユーザーストーリー（例: US1, US2, US3）
- 説明には正確なファイルパスを含める

## パス規約

- **フロントエンド**: `src/` (Expo React Native Web)
- **バックエンド**: `supabase/functions/` (Edge Functions)
- **データベース**: `supabase/migrations/`

---

## Phase 1: セットアップ（共通基盤）

**目的**: プロジェクト初期化と基本構造の構築

- [X] T001 spec.md に基づくプロジェクトディレクトリ構造を作成（src/features, src/shared, src/navigation, src/services, src/assets）
- [X] T002 [P] package.json の依存関係を確認し、不足パッケージをインストール
- [X] T003 [P] Expo プロジェクト用 .gitignore を作成
- [X] T004 ルート App.jsx をプロバイダー階層付きで作成（GestureHandler → Auth → Admin → Toast → Navigator）

---

## Phase 2: 基盤構築（必須前提）

**目的**: いかなるユーザーストーリーの実装にも先立って完了すべきコアインフラ

**⚠️ 重要**: 本フェーズが完了するまでユーザーストーリーの作業は開始不可

### 2.1 Supabase クライアント & データベース

- [X] T005 src/services/supabase/client.js に Supabase クライアントシングルトンを作成
- [X] T006 supabase/migrations/ に josenai_001_schema.sql を作成（9テーブル: josenai_profiles, josenai_organizations, josenai_projects, josenai_submissions, josenai_media_specs, josenai_check_items, josenai_rule_documents, josenai_app_settings + user_profiles参照）
- [X] T007 supabase/migrations/ に josenai_002_rls.sql を作成（fn_is_josenai_*() ヘルパー関数による画面ベース RBAC の RLS ポリシー）
- [X] T008 supabase/migrations/ に josenai_003_seed.sql を作成（josenai_media_specs, josenai_check_items, josenai_rule_documents, josenai_app_settings の初期データ）

### 2.2 認証コンテキスト

- [X] T009 src/shared/contexts/AuthContext.jsx に AuthContext を作成（Google OAuth、@kindai.ac.jp ドメイン制限、user_profiles + josenai_profiles upsert）
- [X] T010 [P] src/shared/contexts/AdminContext.jsx に AdminContext を作成（画面ベース RBAC 管理、Edge Function 経由の bcrypt 検証）
- [X] T011 [P] src/shared/contexts/ToastContext.jsx に ToastContext を作成（アプリ全体の通知）

### 2.3 ナビゲーション構造

- [X] T012 src/navigation/AppNavigator.jsx に AppNavigator を作成（認証状態ルーティング）
- [X] T013 src/navigation/DrawerNavigator.jsx に DrawerNavigator を作成（7画面、管理者条件付き表示）
- [X] T014 src/navigation/components/CustomDrawerContent.jsx に CustomDrawerContent を作成（ダークテーマサイドバー、ヘッダー/フッター付き）

### 2.4 共通コンポーネント

- [X] T015 [P] src/shared/components/ScreenErrorBoundary.jsx に ScreenErrorBoundary を作成
- [X] T016 [P] src/shared/components/LoadingSpinner.jsx に LoadingSpinner を作成
- [X] T017 [P] src/shared/components/PlaceholderContent.jsx に PlaceholderContent を作成
- [X] T017a [P] src/features/submission/components/SubmissionForm.jsx に SubmissionForm 共通コンポーネントを作成（SandboxScreen と SubmitScreen で共用）

### 2.5 認証機能

- [X] T018 src/features/auth/screens/LoginScreen.jsx に LoginScreen を作成
- [X] T019 src/features/auth/components/GoogleLoginButton.jsx に GoogleLoginButton を作成
- [X] T020 src/features/auth/components/AdminPasswordModal.jsx に AdminPasswordModal を作成（3つのロール選択: 広報部/企画管理部/管理者）

### 2.6 Edge Functions（認証）

- [X] T021 supabase/functions/verify-admin-password/index.ts に verify-admin-password Edge Function を作成（bcrypt 検証）
- [X] T022 [P] supabase/functions/_shared/supabase.ts に共有 Supabase クライアントを作成

**チェックポイント**: 基盤構築完了 — Phase 2.7 移行作業を開始可能

---

## Phase 2.7: 共有 Supabase 移行（共有プロジェクト移行）

**目的**: Phase 2 の実装を共有 Ikomasai Supabase プロジェクトの新仕様に合わせて更新する

**⚠️ 重要**: Phase 3 以降の実装は本フェーズ完了後に開始すること

### 2.7.1 データベースマイグレーション書き換え

- [ ] T080 josenai_001_schema.sql を書き換え: profiles → user_profiles(参照) + josenai_profiles に分割、全テーブルを josenai_* プレフィックスにリネーム、submission_type CHECK を ('kikaku','koho') に変更、version/reviewed_by カラム追加
- [ ] T081 [P] josenai_002_rls.sql を書き換え: admin_role チェックを fn_is_josenai_*() ヘルパー関数（koho/kikaku/admin/reviewer）に置換、画面ベース RBAC ポリシー追加
- [ ] T082 [P] josenai_003_seed.sql を書き換え: 全テーブル名を josenai_* プレフィックスに更新

### 2.7.2 コンテキスト更新

- [ ] T083 AuthContext.jsx を更新: プロフィール取得を 'profiles' から user_profiles + josenai_profiles upsert フローに変更
- [ ] T084 AdminContext.jsx を更新: admin_role カラムロジックを画面ベース権限状態（josenai_review_koho/kikaku/admin）に置換

### 2.7.3 認証 UI 更新

- [ ] T085 AdminPasswordModal.jsx を更新: ロールラベルを koho/kikaku/super から 広報部/企画管理部/管理者 に変更、画面識別子を更新

### 2.7.4 Supabase クライアント更新

- [ ] T086 [P] src/services/supabase/client.js を更新: 共有プロジェクトの URL/キー互換性を確認

**チェックポイント**: Phase 2 のコードが共有 Supabase 仕様と整合 — Phase 3 以降を開始可能

---

## Phase 3: ユーザーストーリー 1 - サンドボックス（事前確認） (優先度: P1) 🎯 MVP

**ゴール**: AI判定を事前に試行できる機能（1日3回まで）

**独立テスト**: ファイルをアップロードしてAI判定を実行、リスクスコアと指摘事項が表示される

### US1 の実装タスク

- [ ] T023 [US1] src/features/submission/screens/SandboxScreen.jsx に SandboxScreen を作成（提出先ドロップダウン、残回数表示）
- [ ] T023a [US1] SandboxScreen に AI スキップオプション UI を追加（タイムアウト/エラー時に「AI判定をスキップ」ボタンを表示）
- [ ] T024 [P] [US1] src/features/submission/components/FileUploader.jsx に FileUploader コンポーネントを作成（ドラッグ&ドロップ、ファイルバリデーション）
- [ ] T025 [P] [US1] src/features/submission/components/OrganizationSelect.jsx に OrganizationSelect コンポーネントを作成
- [ ] T026 [P] [US1] src/features/submission/components/ProjectSelect.jsx に ProjectSelect コンポーネントを作成（団体でフィルタリング）
- [ ] T027 [P] [US1] src/features/submission/components/MediaTypeSelect.jsx に MediaTypeSelect コンポーネントを作成
- [ ] T028 [US1] src/features/submission/components/RiskScoreDisplay.jsx に RiskScoreDisplay コンポーネントを作成（0-100 スコア、色分け表示）
- [ ] T029 [US1] src/features/submission/hooks/useOrganizations.js に useOrganizations フックを作成
- [ ] T030 [US1] src/features/submission/hooks/useProjects.js に useProjects フックを作成
- [ ] T031 [US1] src/features/submission/hooks/useMediaSpecs.js に useMediaSpecs フックを作成
- [ ] T032 [US1] src/features/submission/hooks/useSandbox.js に useSandbox フックを作成（josenai_profiles.sandbox_count_today 管理）
- [ ] T033 [US1] supabase/functions/sandbox/index.ts に sandbox Edge Function を作成（Gemini API 連携、30秒タイムアウト、タイムアウト/エラー時は skipped: true を返す）
- [ ] T033a [US1] sandbox Edge Function にタイムアウト処理とフォールバックを追加（30秒タイムアウト、失敗時は skipped フラグ付き ai_risk_details を返す）
- [ ] T034 [P] [US1] supabase/functions/_shared/geminiClient.ts に geminiClient を作成

**チェックポイント**: US1（サンドボックス）が独立して完全に動作・テスト可能であること

---

## Phase 4: ユーザーストーリー 2 - 正式提出 (優先度: P2)

**ゴール**: 企画管理部 or 広報部を選択して正式提出、Google Drive に保存

**独立テスト**: ファイルを提出 → Google Drive に保存 → DB に提出レコード作成

### US2 の実装タスク

- [ ] T035 [US2] src/features/submission/screens/SubmitScreen.jsx に SubmitScreen を作成（リスクベースフロー: low/medium/high）
- [ ] T037 [US2] src/features/submission/components/SubmissionConfirmModal.jsx に SubmissionConfirmModal コンポーネントを作成（中リスク時の警告）
- [ ] T038 [US2] src/features/submission/components/HighRiskReasonInput.jsx に HighRiskReasonInput コンポーネントを作成（高リスク時の理由入力必須）
- [ ] T039 [US2] src/features/submission/hooks/useSubmission.js に useSubmission フックを作成（josenai_submissions INSERT）
- [ ] T040 [US2] supabase/functions/submit/index.ts に submit Edge Function を作成（Google Drive アップロード、josenai_submissions insert、アップロード失敗時はロールバック）
- [ ] T041 [P] [US2] supabase/functions/_shared/driveClient.ts に driveClient を作成（Google Drive API）

**チェックポイント**: US2（正式提出）が独立して完全に動作・テスト可能であること

---

## Phase 5: ユーザーストーリー 3 - 提出履歴 (優先度: P3)

**ゴール**: 自分の提出履歴を確認できる

**独立テスト**: 提出一覧が表示され、各提出の詳細（ステータス、リスクスコア）が確認できる

### US3 の実装タスク

- [ ] T042 [US3] src/features/submission/screens/HistoryScreen.jsx に HistoryScreen を作成
- [ ] T043 [P] [US3] src/features/submission/components/SubmissionCard.jsx に SubmissionCard コンポーネントを作成
- [ ] T044 [P] [US3] src/features/submission/components/SubmissionDetailModal.jsx に SubmissionDetailModal コンポーネントを作成
- [ ] T045 [US3] src/features/submission/hooks/useSubmissionHistory.js に useSubmissionHistory フックを作成（josenai_submissions の RLS 付きクエリ）
- [ ] T046 [US3] src/features/submission/components/StatusBadge.jsx に StatusBadge コンポーネントを作成（pending/approved/rejected）
- [ ] T046a [US3] HistoryScreen に削除ボタンを追加（status='pending' の場合のみ表示）
- [ ] T046b [US3] src/features/submission/components/DeleteConfirmModal.jsx に DeleteConfirmModal を作成
- [ ] T046c [US3] src/features/submission/hooks/useSubmissionDelete.js に useSubmissionDelete フックを作成（josenai_submissions の物理削除 + Google Drive クリーンアップ）

**チェックポイント**: US3（提出履歴）が独立して完全に動作・テスト可能であること

---

## Phase 6: ユーザーストーリー 4 - ダッシュボード（管理者審査） (優先度: P4)

**ゴール**: 担当範囲の提出一覧表示と審査機能

**独立テスト**: 管理者ログイン → 担当範囲の提出一覧表示 → 審査（承認/却下）実行

### US4 の実装タスク

- [ ] T047 [US4] src/features/review/screens/DashboardScreen.jsx に DashboardScreen を作成（画面ベースロールフィルタリング、管理者用 submission_type タブ）
- [ ] T048 [P] [US4] src/features/review/components/SubmissionTable.jsx に SubmissionTable コンポーネントを作成
- [ ] T049 [P] [US4] src/features/review/components/ReviewModal.jsx に ReviewModal コンポーネントを作成（承認/却下、コメント付き）
- [ ] T050 [P] [US4] src/features/review/components/DashboardFilters.jsx に DashboardFilters コンポーネントを作成（ステータス、団体、日付）
- [ ] T051 [US4] src/features/review/hooks/useReviewSubmissions.js に useReviewSubmissions フックを作成（画面ベース RLS フィルタリング: koho/kikaku/admin）
- [ ] T052 [US4] src/features/review/hooks/useReview.js に useReview フックを作成（josenai_submissions.version による楽観的ロック）
- [ ] T053 [US4] supabase/functions/review/index.ts に review Edge Function を作成（josenai_submissions のステータス更新、バージョンチェック付き）

**チェックポイント**: US4（ダッシュボード）が独立して完全に動作・テスト可能であること

---

## Phase 7: ユーザーストーリー 5 - ルール管理 (優先度: P5)

**ゴール**: 情宣ルール・ガイドラインの閲覧と編集

**独立テスト**: ルール文書一覧表示 → 編集 → 保存

### US5 の実装タスク

- [ ] T054 [US5] src/features/rules/screens/RuleListScreen.jsx に RuleListScreen を作成
- [ ] T055 [P] [US5] src/features/rules/components/RuleDocumentCard.jsx に RuleDocumentCard コンポーネントを作成
- [ ] T056 [P] [US5] src/features/rules/components/RuleEditModal.jsx に RuleEditModal コンポーネントを作成（Markdown エディタ）
- [ ] T057 [US5] src/features/rules/hooks/useRuleDocuments.js に useRuleDocuments フックを作成（josenai_rule_documents CRUD）

**チェックポイント**: US5（ルール管理）が独立して完全に動作・テスト可能であること

---

## Phase 8: ユーザーストーリー 6 - マスタ管理 (優先度: P6)

**ゴール**: 団体・企画の CSV インポートによる一括管理

**独立テスト**: CSV ファイルアップロード → DB に反映 → プルダウンに表示

### US6 の実装タスク

- [ ] T058 [US6] src/features/master/screens/MasterScreen.jsx に MasterScreen を作成
- [ ] T059 [P] [US6] src/features/master/components/CsvImporter.jsx に CsvImporter コンポーネントを作成
- [ ] T060 [P] [US6] src/features/master/components/OrganizationTable.jsx に OrganizationTable コンポーネントを作成
- [ ] T061 [P] [US6] src/features/master/components/ProjectTable.jsx に ProjectTable コンポーネントを作成
- [ ] T062 [US6] src/features/master/hooks/useCsvImport.js に useCsvImport フックを作成（multipart/form-data で Edge Functions にアップロード）
- [ ] T063 [US6] supabase/functions/import-organizations/index.ts に import-organizations Edge Function を作成（CSV パース + josenai_organizations UPSERT）
- [ ] T064 [US6] supabase/functions/import-projects/index.ts に import-projects Edge Function を作成（CSV パース + josenai_projects UPSERT）

**チェックポイント**: US6（マスタ管理）が独立して完全に動作・テスト可能であること

---

## Phase 9: ユーザーストーリー 7 - 設定 (優先度: P7)

**ゴール**: システム設定の管理

**独立テスト**: 設定一覧表示 → 値変更 → 保存

### US7 の実装タスク

- [ ] T065 [US7] src/features/settings/screens/SettingsScreen.jsx に SettingsScreen を作成（josenai_app_settings 管理）
- [ ] T066 [P] [US7] src/features/settings/components/SettingItem.jsx に SettingItem コンポーネントを作成
- [ ] T067 [P] [US7] src/features/settings/components/PasswordChangeModal.jsx に PasswordChangeModal コンポーネントを作成
- [ ] T068 [US7] src/features/settings/hooks/useAppSettings.js に useAppSettings フックを作成（josenai_app_settings CRUD）
- [ ] T069 [US7] supabase/functions/update-password/index.ts に update-password Edge Function を作成（bcrypt ハッシュ生成）

**チェックポイント**: US7（設定）が独立して完全に動作・テスト可能であること

---

## Phase 10: 仕上げ & 横断的関心事

**目的**: 複数のユーザーストーリーにまたがる改善

- [ ] T070 [P] 全画面にモバイル向けレスポンシブスタイルを追加（< 768px）
- [ ] T071 [P] Edge Functions にエラーハンドリングとリトライロジックを実装
- [ ] T072 .github/workflows/deploy.yml に GitHub Actions デプロイワークフローを作成（GitHub Pages）
- [ ] T073 ローディング状態とスケルトンスクリーンを追加
- [ ] T074 パフォーマンス最適化（遅延読み込み、メモ化）
- [ ] T075 セキュリティ監査（RLS ポリシー検証、入力バリデーション）

---

## 依存関係 & 実行順序

### フェーズ依存関係

- **セットアップ（Phase 1）**: 依存なし — 即時開始可能
- **基盤構築（Phase 2）**: セットアップ完了に依存
- **移行（Phase 2.7）**: Phase 2 完了に依存 — 全ユーザーストーリーをブロック
- **ユーザーストーリー（Phase 3-9）**: Phase 2.7 完了に依存
  - 人員があれば並列進行可能
  - または優先度順に逐次実行（P1 → P2 → ... → P7）
- **仕上げ（Phase 10）**: 必要なユーザーストーリーの完了に依存

### ユーザーストーリー依存関係

- **US1（P1 - サンドボックス）**: Phase 2.7 完了後に開始可能 — 他ストーリーへの依存なし
- **US2（P2 - 正式提出）**: Phase 2.7 完了後に開始可能 — US1 のコンポーネントを再利用
- **US3（P3 - 提出履歴）**: Phase 2.7 完了後に開始可能 — 独立テスト可能
- **US4（P4 - ダッシュボード）**: Phase 2.7 完了後に開始可能 — 独立テスト可能
- **US5（P5 - ルール管理）**: Phase 2.7 完了後に開始可能 — 独立テスト可能
- **US6（P6 - マスタ管理）**: Phase 2.7 完了後に開始可能 — 独立テスト可能
- **US7（P7 - 設定）**: Phase 2.7 完了後に開始可能 — 独立テスト可能

### 各ユーザーストーリー内の順序

- モデル/フックをコンポーネントより先に
- 共通コンポーネントを画面固有コンポーネントより先に
- フックをそれを使う画面より先に
- Edge Functions はフロントエンドと並列開発可能

### 並列実行の機会

**Phase 2（基盤構築）並列グループ:**
```
グループ A: T005, T006, T007, T008（データベース）
グループ B: T009, T010, T011（コンテキスト） — T005 の後
グループ C: T015, T016, T017（共通コンポーネント） — 独立
グループ D: T018, T019, T020（認証 UI） — T009 の後
```

**Phase 3（US1 - サンドボックス）並列グループ:**
```
グループ A: T024, T025, T026, T027（入力コンポーネント）
グループ B: T029, T030, T031（データフック）
グループ C: T033, T034（Edge Functions）
グループ A, B, C 完了後: T023, T028, T032（画面 & 統合）
```

---

## 並列実行例: ユーザーストーリー 1（サンドボックス）

```bash
# 全入力コンポーネントを同時に起動:
タスク: T024 "src/features/submission/components/FileUploader.jsx に FileUploader コンポーネントを作成"
タスク: T025 "src/features/submission/components/OrganizationSelect.jsx に OrganizationSelect コンポーネントを作成"
タスク: T026 "src/features/submission/components/ProjectSelect.jsx に ProjectSelect コンポーネントを作成"
タスク: T027 "src/features/submission/components/MediaTypeSelect.jsx に MediaTypeSelect コンポーネントを作成"

# 全データフックを同時に起動:
タスク: T029 "src/features/submission/hooks/useOrganizations.js に useOrganizations フックを作成"
タスク: T030 "src/features/submission/hooks/useProjects.js に useProjects フックを作成"
タスク: T031 "src/features/submission/hooks/useMediaSpecs.js に useMediaSpecs フックを作成"

# コンポーネントとフックの準備完了後:
タスク: T023 "src/features/submission/screens/SandboxScreen.jsx に SandboxScreen を作成"
```

---

## 実装戦略

### MVP 優先（US1 のみ）

1. Phase 1: セットアップを完了
2. Phase 2: 基盤構築を完了
3. Phase 2.7: 共有 Supabase 移行を完了（重要 — 全ストーリーをブロック）
4. Phase 3: US1（サンドボックス）を完了
5. **停止して検証**: サンドボックスを独立テスト
6. 準備ができればデプロイ/デモ

### インクリメンタルデリバリー

1. セットアップ + 基盤構築を完了 → 基盤準備完了
2. Phase 2.7: 移行を完了 → 共有 Supabase 整合
3. US1（サンドボックス）追加 → テスト → デプロイ（MVP!）
4. US2（正式提出）追加 → テスト → デプロイ
5. US3（提出履歴）追加 → テスト → デプロイ
6. US4（ダッシュボード）追加 → テスト → デプロイ
7. US5-7 追加 → テスト → デプロイ（フルリリース）

### 並列チーム戦略

複数の開発者がいる場合:

1. チーム全体でセットアップ + 基盤構築 + Phase 2.7 移行を完了
2. Phase 2.7 完了後:
   - 開発者 A: US1 + US2（提出フロー）
   - 開発者 B: US3 + US4（履歴 + ダッシュボード）
   - 開発者 C: US5 + US6 + US7（管理機能）
3. 各ストーリーを独立して完成・統合

---

## サマリー

| フェーズ | タスク数 | 並列実行可能数 |
|----------|----------|----------------|
| Phase 1: セットアップ | 4 | 2 |
| Phase 2: 基盤構築 | 19 | 9 |
| Phase 2.7: 移行 | 7 | 3 |
| Phase 3: US1 - サンドボックス | 14 | 7 |
| Phase 4: US2 - 正式提出 | 6 | 1 |
| Phase 5: US3 - 提出履歴 | 8 | 4 |
| Phase 6: US4 - ダッシュボード | 7 | 3 |
| Phase 7: US5 - ルール管理 | 4 | 2 |
| Phase 8: US6 - マスタ管理 | 7 | 3 |
| Phase 9: US7 - 設定 | 5 | 2 |
| Phase 10: 仕上げ | 6 | 2 |
| **合計** | **87** | **38** |

**MVP スコープ**: Phase 1 + Phase 2 + Phase 2.7 + Phase 3 = **44 タスク**

---

## 備考

- [P] タスク = 異なるファイルで依存関係なし
- [ストーリー] ラベルはタスクを特定のユーザーストーリーに紐付け、追跡性を確保
- 各ユーザーストーリーは独立して完了・テスト可能であること
- タスクまたは論理的なグループごとにコミット
- 各チェックポイントで停止してストーリーを独立検証可能
- Edge Functions は Supabase の要件に従い TypeScript (.ts) を使用
- フロントエンドは技術スタックの指定に従い JavaScript (.jsx) を使用

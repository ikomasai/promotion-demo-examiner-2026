# Tasks: 生駒祭 情宣AI判定システム

**Input**: Design documents from `/docs/`
**Prerequisites**: spec.md (required)

**Tests**: テストは明示的に要求されていないため省略

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/` (Expo React Native Web)
- **Backend**: `supabase/functions/` (Edge Functions)
- **Database**: `supabase/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project directory structure per spec.md (src/features, src/shared, src/navigation, src/services, src/assets)
- [X] T002 [P] Verify package.json dependencies and install missing packages
- [X] T003 [P] Create .gitignore for Expo project
- [X] T004 Create root App.jsx with provider hierarchy (GestureHandler → Auth → Admin → Toast → Navigator)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### 2.1 Supabase Client & Database

- [X] T005 Create Supabase client singleton in src/services/supabase/client.js
- [ ] T006 Create database migration 001_initial_schema.sql in supabase/migrations/ (8 tables: profiles, organizations, projects, submissions, media_specs, check_items, rule_documents, app_settings)
- [ ] T007 Create database migration 002_rls_policies.sql in supabase/migrations/ (RLS policies for all tables with admin role conditions)
- [ ] T008 Create database migration 003_seed_data.sql in supabase/migrations/ (initial data for media_specs, check_items, rule_documents, app_settings)

### 2.2 Authentication Context

- [ ] T009 Create AuthContext in src/shared/contexts/AuthContext.jsx (Google OAuth, @kindai.ac.jp domain restriction, profile fetch)
- [ ] T010 [P] Create AdminContext in src/shared/contexts/AdminContext.jsx (admin role management, bcrypt verification via Edge Function)
- [ ] T011 [P] Create ToastContext in src/shared/contexts/ToastContext.jsx (app-wide notifications)

### 2.3 Navigation Structure

- [ ] T012 Create AppNavigator in src/navigation/AppNavigator.jsx (auth state routing)
- [ ] T013 Create DrawerNavigator in src/navigation/DrawerNavigator.jsx (7 screens, admin-conditional visibility)
- [ ] T014 Create CustomDrawerContent in src/navigation/components/CustomDrawerContent.jsx (dark theme sidebar with header/footer)

### 2.4 Shared Components

- [ ] T015 [P] Create ScreenErrorBoundary in src/shared/components/ScreenErrorBoundary.jsx
- [ ] T016 [P] Create LoadingSpinner in src/shared/components/LoadingSpinner.jsx
- [ ] T017 [P] Create PlaceholderContent in src/shared/components/PlaceholderContent.jsx
- [ ] T017a [P] Create SubmissionForm shared component in src/features/submission/components/SubmissionForm.jsx (used by both SandboxScreen and SubmitScreen)

### 2.5 Auth Feature

- [ ] T018 Create LoginScreen in src/features/auth/screens/LoginScreen.jsx
- [ ] T019 Create GoogleLoginButton in src/features/auth/components/GoogleLoginButton.jsx
- [ ] T020 Create AdminPasswordModal in src/features/auth/components/AdminPasswordModal.jsx (3 role options: koho/kikaku/super)

### 2.6 Edge Functions (Authentication)

- [ ] T021 Create verify-admin-password Edge Function in supabase/functions/verify-admin-password/index.ts (bcrypt verification)
- [ ] T022 [P] Create shared Supabase client in supabase/functions/_shared/supabase.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - サンドボックス（事前確認） (Priority: P1) 🎯 MVP

**Goal**: AI判定を事前に試行できる機能（1日3回まで）

**Independent Test**: ファイルをアップロードしてAI判定を実行、リスクスコアと指摘事項が表示される

### Implementation for User Story 1

- [ ] T023 [US1] Create SandboxScreen in src/features/submission/screens/SandboxScreen.jsx (submission type dropdown, remaining count display)
- [ ] T023a [US1] Add AI skip option UI to SandboxScreen (display "AI判定をスキップ" button on timeout/error)
- [ ] T024 [P] [US1] Create FileUploader component in src/features/submission/components/FileUploader.jsx (drag & drop, file validation)
- [ ] T025 [P] [US1] Create OrganizationSelect component in src/features/submission/components/OrganizationSelect.jsx
- [ ] T026 [P] [US1] Create ProjectSelect component in src/features/submission/components/ProjectSelect.jsx (filtered by organization)
- [ ] T027 [P] [US1] Create MediaTypeSelect component in src/features/submission/components/MediaTypeSelect.jsx
- [ ] T028 [US1] Create RiskScoreDisplay component in src/features/submission/components/RiskScoreDisplay.jsx (0-100 score with color coding)
- [ ] T029 [US1] Create useOrganizations hook in src/features/submission/hooks/useOrganizations.js
- [ ] T030 [US1] Create useProjects hook in src/features/submission/hooks/useProjects.js
- [ ] T031 [US1] Create useMediaSpecs hook in src/features/submission/hooks/useMediaSpecs.js
- [ ] T032 [US1] Create useSandbox hook in src/features/submission/hooks/useSandbox.js (daily count management)
- [ ] T033 [US1] Create sandbox Edge Function in supabase/functions/sandbox/index.ts (Gemini API integration, 30秒タイムアウト, タイムアウト/エラー時は skipped: true を返す)
- [ ] T033a [US1] Add timeout handling and fallback to sandbox Edge Function (30s timeout, return ai_risk_details with skipped flag on failure)
- [ ] T034 [P] [US1] Create geminiClient in supabase/functions/_shared/geminiClient.ts

**Checkpoint**: User Story 1 (Sandbox) should be fully functional and testable independently

---

## Phase 4: User Story 2 - 正式提出 (Priority: P2)

**Goal**: 企画物/SNS を選択して正式提出、Google Drive に保存

**Independent Test**: ファイルを提出 → Google Drive に保存 → DB に提出レコード作成

### Implementation for User Story 2

- [ ] T035 [US2] Create SubmitScreen in src/features/submission/screens/SubmitScreen.jsx (risk-based flow: low/medium/high)
- [ ] T036 [US2] Create SubmissionForm component in src/features/submission/components/SubmissionForm.jsx (reuse from sandbox)
- [ ] T037 [US2] Create SubmissionConfirmModal component in src/features/submission/components/SubmissionConfirmModal.jsx (warning for medium risk)
- [ ] T038 [US2] Create HighRiskReasonInput component in src/features/submission/components/HighRiskReasonInput.jsx (required for high risk)
- [ ] T039 [US2] Create useSubmission hook in src/features/submission/hooks/useSubmission.js
- [ ] T040 [US2] Create submit Edge Function in supabase/functions/submit/index.ts (Google Drive upload, DB insert, アップロード失敗時はロールバックしてエラー表示)
- [ ] T041 [P] [US2] Create driveClient in supabase/functions/_shared/driveClient.ts (Google Drive API)

**Checkpoint**: User Story 2 (Submit) should be fully functional and testable independently

---

## Phase 5: User Story 3 - 提出履歴 (Priority: P3)

**Goal**: 自分の提出履歴を確認できる

**Independent Test**: 提出一覧が表示され、各提出の詳細（ステータス、リスクスコア）が確認できる

### Implementation for User Story 3

- [ ] T042 [US3] Create HistoryScreen in src/features/submission/screens/HistoryScreen.jsx
- [ ] T043 [P] [US3] Create SubmissionCard component in src/features/submission/components/SubmissionCard.jsx
- [ ] T044 [P] [US3] Create SubmissionDetailModal component in src/features/submission/components/SubmissionDetailModal.jsx
- [ ] T045 [US3] Create useSubmissionHistory hook in src/features/submission/hooks/useSubmissionHistory.js
- [ ] T046 [US3] Create StatusBadge component in src/features/submission/components/StatusBadge.jsx (pending/approved/rejected)
- [ ] T046a [US3] Add delete button to HistoryScreen (visible only for status='pending')
- [ ] T046b [US3] Create DeleteConfirmModal in src/features/submission/components/DeleteConfirmModal.jsx
- [ ] T046c [US3] Create useSubmissionDelete hook in src/features/submission/hooks/useSubmissionDelete.js (physical delete from DB + Google Drive)

**Checkpoint**: User Story 3 (History) should be fully functional and testable independently

---

## Phase 6: User Story 4 - ダッシュボード（管理者審査） (Priority: P4)

**Goal**: 担当範囲の提出一覧表示と審査機能

**Independent Test**: 管理者ログイン → 担当範囲の提出一覧表示 → 審査（承認/却下）実行

### Implementation for User Story 4

- [ ] T047 [US4] Create DashboardScreen in src/features/review/screens/DashboardScreen.jsx (admin role filtering, submission type tabs for super admin)
- [ ] T048 [P] [US4] Create SubmissionTable component in src/features/review/components/SubmissionTable.jsx
- [ ] T049 [P] [US4] Create ReviewModal component in src/features/review/components/ReviewModal.jsx (approve/reject with comment)
- [ ] T050 [P] [US4] Create DashboardFilters component in src/features/review/components/DashboardFilters.jsx (status, organization, date)
- [ ] T051 [US4] Create useReviewSubmissions hook in src/features/review/hooks/useReviewSubmissions.js (RLS-based filtering)
- [ ] T052 [US4] Create useReview hook in src/features/review/hooks/useReview.js (optimistic locking with version)
- [ ] T053 [US4] Create review Edge Function in supabase/functions/review/index.ts (status update with version check)

**Checkpoint**: User Story 4 (Dashboard) should be fully functional and testable independently

---

## Phase 7: User Story 5 - ルール管理 (Priority: P5)

**Goal**: 情宣ルール・ガイドラインの閲覧と編集

**Independent Test**: ルール文書一覧表示 → 編集 → 保存

### Implementation for User Story 5

- [ ] T054 [US5] Create RuleListScreen in src/features/rules/screens/RuleListScreen.jsx
- [ ] T055 [P] [US5] Create RuleDocumentCard component in src/features/rules/components/RuleDocumentCard.jsx
- [ ] T056 [P] [US5] Create RuleEditModal component in src/features/rules/components/RuleEditModal.jsx (Markdown editor)
- [ ] T057 [US5] Create useRuleDocuments hook in src/features/rules/hooks/useRuleDocuments.js

**Checkpoint**: User Story 5 (Rules) should be fully functional and testable independently

---

## Phase 8: User Story 6 - マスタ管理 (Priority: P6)

**Goal**: 団体・企画の CSV インポートによる一括管理

**Independent Test**: CSV ファイルアップロード → DB に反映 → プルダウンに表示

### Implementation for User Story 6

- [ ] T058 [US6] Create MasterScreen in src/features/master/screens/MasterScreen.jsx
- [ ] T059 [P] [US6] Create CsvImporter component in src/features/master/components/CsvImporter.jsx
- [ ] T060 [P] [US6] Create OrganizationTable component in src/features/master/components/OrganizationTable.jsx
- [ ] T061 [P] [US6] Create ProjectTable component in src/features/master/components/ProjectTable.jsx
- [ ] T062 [US6] Create useCsvImport hook in src/features/master/hooks/useCsvImport.js (papaparse integration)
- [ ] T063 [US6] Create import-organizations Edge Function in supabase/functions/import-organizations/index.ts
- [ ] T064 [US6] Create import-projects Edge Function in supabase/functions/import-projects/index.ts

**Checkpoint**: User Story 6 (Master) should be fully functional and testable independently

---

## Phase 9: User Story 7 - 設定 (Priority: P7)

**Goal**: システム設定の管理

**Independent Test**: 設定一覧表示 → 値変更 → 保存

### Implementation for User Story 7

- [ ] T065 [US7] Create SettingsScreen in src/features/settings/screens/SettingsScreen.jsx
- [ ] T066 [P] [US7] Create SettingItem component in src/features/settings/components/SettingItem.jsx
- [ ] T067 [P] [US7] Create PasswordChangeModal component in src/features/settings/components/PasswordChangeModal.jsx
- [ ] T068 [US7] Create useAppSettings hook in src/features/settings/hooks/useAppSettings.js
- [ ] T069 [US7] Create update-password Edge Function in supabase/functions/update-password/index.ts (bcrypt hash generation)

**Checkpoint**: User Story 7 (Settings) should be fully functional and testable independently

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T070 [P] Add responsive styles for mobile (< 768px) across all screens
- [ ] T071 [P] Implement error handling and retry logic for Edge Functions
- [ ] T072 Create GitHub Actions deploy workflow in .github/workflows/deploy.yml (GitHub Pages)
- [ ] T073 Add loading states and skeleton screens
- [ ] T074 Performance optimization (lazy loading, memoization)
- [ ] T075 Security audit (RLS policy verification, input validation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → ... → P7)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Sandbox)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2 - Submit)**: Can start after Foundational - Reuses components from US1
- **User Story 3 (P3 - History)**: Can start after Foundational - Independently testable
- **User Story 4 (P4 - Dashboard)**: Can start after Foundational - Independently testable
- **User Story 5 (P5 - Rules)**: Can start after Foundational - Independently testable
- **User Story 6 (P6 - Master)**: Can start after Foundational - Independently testable
- **User Story 7 (P7 - Settings)**: Can start after Foundational - Independently testable

### Within Each User Story

- Models/hooks before components
- Shared components before screen-specific components
- Hooks before screens that use them
- Edge Functions can be developed in parallel with frontend

### Parallel Opportunities

**Phase 2 (Foundational) Parallel Groups:**
```
Group A: T005, T006, T007, T008 (Database)
Group B: T009, T010, T011 (Contexts) - after T005
Group C: T015, T016, T017 (Shared Components) - independent
Group D: T018, T019, T020 (Auth UI) - after T009
```

**Phase 3 (US1 - Sandbox) Parallel Groups:**
```
Group A: T024, T025, T026, T027 (Input Components)
Group B: T029, T030, T031 (Data Hooks)
Group C: T033, T034 (Edge Functions)
After Groups A, B, C: T023, T028, T032 (Screen & Integration)
```

---

## Parallel Example: User Story 1 (Sandbox)

```bash
# Launch all input components together:
Task: T024 "Create FileUploader component in src/features/submission/components/FileUploader.jsx"
Task: T025 "Create OrganizationSelect component in src/features/submission/components/OrganizationSelect.jsx"
Task: T026 "Create ProjectSelect component in src/features/submission/components/ProjectSelect.jsx"
Task: T027 "Create MediaTypeSelect component in src/features/submission/components/MediaTypeSelect.jsx"

# Launch all data hooks together:
Task: T029 "Create useOrganizations hook in src/features/submission/hooks/useOrganizations.js"
Task: T030 "Create useProjects hook in src/features/submission/hooks/useProjects.js"
Task: T031 "Create useMediaSpecs hook in src/features/submission/hooks/useMediaSpecs.js"

# After components and hooks are ready:
Task: T023 "Create SandboxScreen in src/features/submission/screens/SandboxScreen.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Sandbox)
4. **STOP and VALIDATE**: Test Sandbox independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Sandbox) → Test → Deploy (MVP!)
3. Add User Story 2 (Submit) → Test → Deploy
4. Add User Story 3 (History) → Test → Deploy
5. Add User Story 4 (Dashboard) → Test → Deploy
6. Add User Story 5-7 → Test → Deploy (Full Release)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + 2 (Submission flow)
   - Developer B: User Story 3 + 4 (History + Dashboard)
   - Developer C: User Story 5 + 6 + 7 (Admin features)
3. Stories complete and integrate independently

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Phase 1: Setup | 4 | 2 |
| Phase 2: Foundational | 19 | 9 |
| Phase 3: US1 - Sandbox | 14 | 7 |
| Phase 4: US2 - Submit | 7 | 1 |
| Phase 5: US3 - History | 8 | 4 |
| Phase 6: US4 - Dashboard | 7 | 3 |
| Phase 7: US5 - Rules | 4 | 2 |
| Phase 8: US6 - Master | 7 | 3 |
| Phase 9: US7 - Settings | 5 | 2 |
| Phase 10: Polish | 6 | 2 |
| **Total** | **81** | **35** |

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 = **37 tasks**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Edge Functions use TypeScript (.ts) as required by Supabase
- Frontend uses JavaScript (.jsx) as specified in tech stack

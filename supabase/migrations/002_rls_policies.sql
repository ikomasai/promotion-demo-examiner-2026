-- ============================================================
-- 002_rls_policies.sql
-- 生駒祭 情宣AI判定システム - Row Level Security ポリシー
-- ============================================================
-- 作成日: 2026-01-25
-- 説明: 全テーブルのRLSポリシー定義
--       管理者権限による閲覧・更新範囲制御
-- ============================================================

-- RLS 有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- profiles テーブル
-- 本人のみ閲覧・更新可能
-- ------------------------------------------------------------
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- ------------------------------------------------------------
-- organizations テーブル
-- 全員閲覧可能、管理者のみ更新可能
-- ------------------------------------------------------------
CREATE POLICY "organizations_select_all" ON organizations
    FOR SELECT USING (TRUE);

CREATE POLICY "organizations_insert_admin" ON organizations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role = 'super'
        )
    );

CREATE POLICY "organizations_update_admin" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role = 'super'
        )
    );

CREATE POLICY "organizations_delete_admin" ON organizations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role = 'super'
        )
    );

-- ------------------------------------------------------------
-- projects テーブル
-- 全員閲覧可能、管理者のみ更新可能
-- ------------------------------------------------------------
CREATE POLICY "projects_select_all" ON projects
    FOR SELECT USING (TRUE);

CREATE POLICY "projects_insert_admin" ON projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role = 'super'
        )
    );

CREATE POLICY "projects_update_admin" ON projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role = 'super'
        )
    );

CREATE POLICY "projects_delete_admin" ON projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role = 'super'
        )
    );

-- ------------------------------------------------------------
-- submissions テーブル
-- 複雑な権限制御:
-- - 一般ユーザー: 自分の提出のみ
-- - koho管理者: SNS提出のみ
-- - kikaku管理者: 企画物のみ
-- - super管理者: 全件
-- - 過去の審査者: 自分が審査した提出物
-- ------------------------------------------------------------
CREATE POLICY "submissions_select" ON submissions
    FOR SELECT USING (
        -- 自分の提出
        user_id = auth.uid()
        OR
        -- 過去に審査した提出物（監査証跡）
        reviewed_by = auth.uid()
        OR
        -- 管理者権限による閲覧
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                -- スーパー管理者は全件
                profiles.admin_role = 'super'
                OR
                -- 広報部管理者はSNSのみ
                (profiles.admin_role = 'koho' AND submissions.submission_type = 'sns')
                OR
                -- 企画管理部管理者は企画物のみ
                (profiles.admin_role = 'kikaku' AND submissions.submission_type = 'project')
            )
        )
    );

CREATE POLICY "submissions_insert" ON submissions
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

CREATE POLICY "submissions_update_admin" ON submissions
    FOR UPDATE USING (
        -- 管理者のみ審査可能（担当範囲のみ）
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.admin_role = 'super'
                OR
                (profiles.admin_role = 'koho' AND submissions.submission_type = 'sns')
                OR
                (profiles.admin_role = 'kikaku' AND submissions.submission_type = 'project')
            )
        )
    );

CREATE POLICY "submissions_delete_own_pending" ON submissions
    FOR DELETE USING (
        -- 自分の提出かつpending状態のみ削除可能
        user_id = auth.uid()
        AND status = 'pending'
    );

-- ------------------------------------------------------------
-- media_specs テーブル
-- 全員閲覧可能（参照マスタ）
-- ------------------------------------------------------------
CREATE POLICY "media_specs_select_all" ON media_specs
    FOR SELECT USING (TRUE);

-- ------------------------------------------------------------
-- check_items テーブル
-- 全員閲覧可能（AI判定基準）
-- ------------------------------------------------------------
CREATE POLICY "check_items_select_all" ON check_items
    FOR SELECT USING (TRUE);

-- ------------------------------------------------------------
-- rule_documents テーブル
-- 全員閲覧可能、管理者のみ更新可能
-- ------------------------------------------------------------
CREATE POLICY "rule_documents_select_all" ON rule_documents
    FOR SELECT USING (TRUE);

CREATE POLICY "rule_documents_update_admin" ON rule_documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role IS NOT NULL
        )
    );

-- ------------------------------------------------------------
-- app_settings テーブル
-- パスワードハッシュ以外は閲覧可能、更新はスーパー管理者のみ
-- ------------------------------------------------------------
CREATE POLICY "app_settings_select_non_sensitive" ON app_settings
    FOR SELECT USING (
        -- パスワードハッシュは非公開
        NOT (key LIKE '%password%')
        OR
        -- 管理者はパスワードハッシュも閲覧可能
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role IS NOT NULL
        )
    );

CREATE POLICY "app_settings_update_super" ON app_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role = 'super'
        )
    );

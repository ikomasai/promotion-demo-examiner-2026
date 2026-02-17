-- ============================================================
-- josenai_002_rls.sql
-- 生駒祭 情宣AI判定システム - Row Level Security ポリシー
-- ============================================================
-- 作成日: 2026-01-25
-- 更新日: 2026-02-17 (共有Supabase移行: fn_is_josenai_*() ヘルパー関数ベースに変更)
-- 説明: 共有RBACの fn_has_screen_access() をラップしたヘルパー関数を定義し、
--       全情宣テーブルのRLSポリシーで使用する。
-- ============================================================

-- ------------------------------------------------------------
-- ヘルパー関数: 共有RBAC fn_has_screen_access() のラッパー
-- 共有プロジェクトに fn_has_screen_access(TEXT) が既に定義されている前提
-- ------------------------------------------------------------

/**
 * 広報部審査権限チェック
 * josenai_review_koho screen へのアクセス権を持つかどうか
 */
CREATE OR REPLACE FUNCTION fn_is_josenai_koho()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN fn_has_screen_access('josenai_review_koho');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

/**
 * 企画管理部審査権限チェック
 * josenai_review_kikaku screen へのアクセス権を持つかどうか
 */
CREATE OR REPLACE FUNCTION fn_is_josenai_kikaku()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN fn_has_screen_access('josenai_review_kikaku');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

/**
 * 管理者権限チェック
 * josenai_admin screen へのアクセス権を持つかどうか
 */
CREATE OR REPLACE FUNCTION fn_is_josenai_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN fn_has_screen_access('josenai_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

/**
 * 審査権限チェック（広報部 OR 企画管理部 OR 管理者）
 * いずれかの審査権限を持つかどうか
 */
CREATE OR REPLACE FUNCTION fn_is_josenai_reviewer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN fn_is_josenai_koho() OR fn_is_josenai_kikaku() OR fn_is_josenai_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS 有効化
-- ============================================================
ALTER TABLE josenai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE josenai_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE josenai_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE josenai_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE josenai_media_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE josenai_check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE josenai_rule_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE josenai_app_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- josenai_profiles テーブル
-- 本人のみ閲覧・作成・更新可能
-- ------------------------------------------------------------
CREATE POLICY "josenai_profiles_select_own" ON josenai_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "josenai_profiles_insert_own" ON josenai_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "josenai_profiles_update_own" ON josenai_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- josenai_organizations テーブル
-- 全員閲覧可能、管理者のみ更新可能
-- ------------------------------------------------------------
CREATE POLICY "josenai_organizations_select_all" ON josenai_organizations
    FOR SELECT USING (TRUE);

CREATE POLICY "josenai_organizations_insert_admin" ON josenai_organizations
    FOR INSERT WITH CHECK (fn_is_josenai_admin());

CREATE POLICY "josenai_organizations_update_admin" ON josenai_organizations
    FOR UPDATE USING (fn_is_josenai_admin());

CREATE POLICY "josenai_organizations_delete_admin" ON josenai_organizations
    FOR DELETE USING (fn_is_josenai_admin());

-- ------------------------------------------------------------
-- josenai_projects テーブル
-- 全員閲覧可能、管理者のみ更新可能
-- ------------------------------------------------------------
CREATE POLICY "josenai_projects_select_all" ON josenai_projects
    FOR SELECT USING (TRUE);

CREATE POLICY "josenai_projects_insert_admin" ON josenai_projects
    FOR INSERT WITH CHECK (fn_is_josenai_admin());

CREATE POLICY "josenai_projects_update_admin" ON josenai_projects
    FOR UPDATE USING (fn_is_josenai_admin());

CREATE POLICY "josenai_projects_delete_admin" ON josenai_projects
    FOR DELETE USING (fn_is_josenai_admin());

-- ------------------------------------------------------------
-- josenai_submissions テーブル
-- 複雑な権限制御:
-- - 一般ユーザー: 自分の提出のみ
-- - 広報部: koho提出のみ
-- - 企画管理部: kikaku提出のみ
-- - 管理者: 全件
-- - 過去の審査者: 自分が審査した提出物（監査証跡）
-- ------------------------------------------------------------
CREATE POLICY "josenai_submissions_select" ON josenai_submissions
    FOR SELECT USING (
        -- 自分の提出
        user_id = auth.uid()
        OR
        -- 過去に審査した提出物（監査証跡）
        reviewed_by = auth.uid()
        OR
        -- 管理者は全件閲覧
        fn_is_josenai_admin()
        OR
        -- 広報部は koho 提出のみ
        (fn_is_josenai_koho() AND submission_type = 'koho')
        OR
        -- 企画管理部は kikaku 提出のみ
        (fn_is_josenai_kikaku() AND submission_type = 'kikaku')
    );

CREATE POLICY "josenai_submissions_insert" ON josenai_submissions
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

CREATE POLICY "josenai_submissions_update_reviewer" ON josenai_submissions
    FOR UPDATE USING (
        -- 管理者は全件更新可能
        fn_is_josenai_admin()
        OR
        -- 広報部は koho 提出のみ
        (fn_is_josenai_koho() AND submission_type = 'koho')
        OR
        -- 企画管理部は kikaku 提出のみ
        (fn_is_josenai_kikaku() AND submission_type = 'kikaku')
    );

CREATE POLICY "josenai_submissions_delete_own_pending" ON josenai_submissions
    FOR DELETE USING (
        -- 自分の提出かつ pending 状態のみ削除可能
        user_id = auth.uid()
        AND status = 'pending'
    );

-- ------------------------------------------------------------
-- josenai_media_specs テーブル
-- 全員閲覧可能（参照マスタ）
-- ------------------------------------------------------------
CREATE POLICY "josenai_media_specs_select_all" ON josenai_media_specs
    FOR SELECT USING (TRUE);

-- ------------------------------------------------------------
-- josenai_check_items テーブル
-- 全員閲覧可能（AI判定基準）
-- ------------------------------------------------------------
CREATE POLICY "josenai_check_items_select_all" ON josenai_check_items
    FOR SELECT USING (TRUE);

-- ------------------------------------------------------------
-- josenai_rule_documents テーブル
-- 全員閲覧可能、審査権限保持者のみ更新可能
-- ------------------------------------------------------------
CREATE POLICY "josenai_rule_documents_select_all" ON josenai_rule_documents
    FOR SELECT USING (TRUE);

CREATE POLICY "josenai_rule_documents_update_reviewer" ON josenai_rule_documents
    FOR UPDATE USING (fn_is_josenai_reviewer());

-- ------------------------------------------------------------
-- josenai_app_settings テーブル
-- パスワードハッシュ以外は閲覧可能、更新は管理者のみ
-- ------------------------------------------------------------
CREATE POLICY "josenai_app_settings_select_non_sensitive" ON josenai_app_settings
    FOR SELECT USING (
        -- パスワードハッシュは審査権限保持者のみ閲覧可能
        NOT (key LIKE '%password%')
        OR
        fn_is_josenai_reviewer()
    );

CREATE POLICY "josenai_app_settings_update_admin" ON josenai_app_settings
    FOR UPDATE USING (fn_is_josenai_admin());

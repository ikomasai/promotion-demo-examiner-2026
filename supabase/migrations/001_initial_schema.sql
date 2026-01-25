-- ============================================================
-- 001_initial_schema.sql
-- 生駒祭 情宣AI判定システム - 初期データベーススキーマ
-- ============================================================
-- 作成日: 2026-01-25
-- 説明: 8テーブルの初期スキーマ定義
--       profiles, organizations, projects, submissions,
--       media_specs, check_items, rule_documents, app_settings
-- ============================================================

-- ------------------------------------------------------------
-- 1. profiles テーブル
-- ユーザープロフィール（auth.users と 1:1 連携）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    admin_role TEXT CHECK (admin_role IN ('koho', 'kikaku', 'super')),
    sandbox_count_today INTEGER NOT NULL DEFAULT 0,
    sandbox_count_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'ユーザープロフィール（Supabase Auth と連携）';
COMMENT ON COLUMN profiles.admin_role IS '管理者権限: NULL=一般, koho=広報部, kikaku=企画管理部, super=スーパー管理者';
COMMENT ON COLUMN profiles.sandbox_count_today IS '本日のサンドボックス使用回数（1日3回まで）';
COMMENT ON COLUMN profiles.sandbox_count_date IS 'サンドボックスカウントの日付（JST 0:00 リセット）';

-- ------------------------------------------------------------
-- 2. organizations テーブル
-- 団体マスタ（CSV インポートで管理）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_code TEXT NOT NULL UNIQUE,
    organization_name TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE organizations IS '団体マスタ（CSVインポートで一括管理）';
COMMENT ON COLUMN organizations.organization_code IS '団体コード（例: ORG001）';
COMMENT ON COLUMN organizations.category IS 'カテゴリ（例: 文化会, 体育会）';

CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(organization_code);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active) WHERE is_active = TRUE;

-- ------------------------------------------------------------
-- 3. projects テーブル
-- 企画マスタ（団体に紐づく）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code TEXT NOT NULL UNIQUE,
    project_name TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE projects IS '企画マスタ（団体に紐づく）';
COMMENT ON COLUMN projects.project_code IS '企画コード（例: PRJ001）';

CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active) WHERE is_active = TRUE;

-- ------------------------------------------------------------
-- 4. submissions テーブル
-- 提出情報（AI判定結果、Google Drive連携）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    submission_type TEXT NOT NULL CHECK (submission_type IN ('project', 'sns')),
    media_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    drive_file_id TEXT,
    drive_file_url TEXT,
    ai_risk_score INTEGER CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
    ai_risk_details JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    user_comment TEXT,
    reviewer_comment TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE submissions IS '提出情報（AI判定結果、審査状態を管理）';
COMMENT ON COLUMN submissions.submission_type IS '提出種別: project=企画物, sns=SNS';
COMMENT ON COLUMN submissions.ai_risk_score IS 'AIリスクスコア（0-100）';
COMMENT ON COLUMN submissions.ai_risk_details IS 'AI指摘内容（JSONB形式）';
COMMENT ON COLUMN submissions.status IS '審査状態: pending=審査待ち, approved=承認, rejected=却下';
COMMENT ON COLUMN submissions.version IS '楽観的ロック用バージョン（更新時インクリメント）';

CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewer ON submissions(reviewed_by) WHERE reviewed_by IS NOT NULL;

-- ------------------------------------------------------------
-- 5. media_specs テーブル
-- メディア規格マスタ
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_type TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    allowed_extensions TEXT[] NOT NULL,
    max_file_size_mb INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE media_specs IS 'メディア規格マスタ（許可ファイル形式、サイズ上限）';
COMMENT ON COLUMN media_specs.allowed_extensions IS '許可拡張子（配列形式）';

-- ------------------------------------------------------------
-- 6. check_items テーブル
-- AI判定チェック項目マスタ
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS check_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('prohibited', 'copyright', 'format')),
    item_code TEXT NOT NULL UNIQUE,
    item_name TEXT NOT NULL,
    description TEXT,
    risk_weight INTEGER NOT NULL CHECK (risk_weight IN (5, 15, 30)),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE check_items IS 'AI判定チェック項目マスタ';
COMMENT ON COLUMN check_items.category IS 'カテゴリ: prohibited=禁止事項(30点), copyright=著作権(15点), format=フォーマット(5点)';
COMMENT ON COLUMN check_items.risk_weight IS 'リスク重み: 30=重大, 15=中程度, 5=軽微';

CREATE INDEX IF NOT EXISTS idx_check_items_category ON check_items(category);
CREATE INDEX IF NOT EXISTS idx_check_items_active ON check_items(is_active) WHERE is_active = TRUE;

-- ------------------------------------------------------------
-- 7. rule_documents テーブル
-- 情宣ルール・ガイドライン文書マスタ
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rule_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL CHECK (document_type IN ('josenai_rule', 'copyright_guideline', 'submission_guide')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE rule_documents IS '情宣ルール・ガイドライン文書';
COMMENT ON COLUMN rule_documents.document_type IS '文書種別: josenai_rule, copyright_guideline, submission_guide';

-- ------------------------------------------------------------
-- 8. app_settings テーブル
-- アプリケーション設定（キーバリュー形式）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE app_settings IS 'アプリケーション設定（管理者パスワード、制限値等）';

-- ------------------------------------------------------------
-- トリガー: updated_at 自動更新
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_check_items_updated_at
    BEFORE UPDATE ON check_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rule_documents_updated_at
    BEFORE UPDATE ON rule_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- トリガー: 新規ユーザー登録時に profiles 自動作成
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- josenai_001_schema.sql
-- 生駒祭 情宣AI判定システム - 初期データベーススキーマ
-- ============================================================
-- 作成日: 2026-01-25
-- 更新日: 2026-02-17 (共有Supabase移行: josenai_ プレフィックス追加)
-- 説明: 共有Ikomasai Supabaseプロジェクト上に情宣固有テーブルを作成。
--       profiles テーブルは削除し、共有 user_profiles + 情宣固有
--       josenai_profiles に分離。全テーブルに josenai_ プレフィックス。
-- ============================================================

-- ------------------------------------------------------------
-- 1. josenai_profiles テーブル
-- 情宣システム固有のユーザーデータ（サンドボックス利用制限）
-- 共有 user_profiles テーブルとは別に管理
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS josenai_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    sandbox_count_today INTEGER NOT NULL DEFAULT 0,
    sandbox_count_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE josenai_profiles IS '情宣システム固有ユーザーデータ（サンドボックス利用制限）';
COMMENT ON COLUMN josenai_profiles.user_id IS 'auth.users.id への外部キー（1:1）';
COMMENT ON COLUMN josenai_profiles.sandbox_count_today IS '本日のサンドボックス使用回数（1日3回まで）';
COMMENT ON COLUMN josenai_profiles.sandbox_count_date IS 'サンドボックスカウントの日付（JST 0:00 リセット）';

-- ------------------------------------------------------------
-- 2. josenai_organizations テーブル
-- 団体マスタ（CSV インポートで管理）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS josenai_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_code TEXT NOT NULL UNIQUE,
    organization_name TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE josenai_organizations IS '団体マスタ（CSVインポートで一括管理）';
COMMENT ON COLUMN josenai_organizations.organization_code IS '団体コード（例: ORG001）';
COMMENT ON COLUMN josenai_organizations.category IS 'カテゴリ（例: 文化会, 体育会）';

CREATE INDEX IF NOT EXISTS josenai_idx_organizations_code ON josenai_organizations(organization_code);
CREATE INDEX IF NOT EXISTS josenai_idx_organizations_active ON josenai_organizations(is_active) WHERE is_active = TRUE;

-- ------------------------------------------------------------
-- 3. josenai_projects テーブル
-- 企画マスタ（団体に紐づく）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS josenai_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code TEXT NOT NULL UNIQUE,
    project_name TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES josenai_organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE josenai_projects IS '企画マスタ（団体に紐づく）';
COMMENT ON COLUMN josenai_projects.project_code IS '企画コード（例: PRJ001）';

CREATE INDEX IF NOT EXISTS josenai_idx_projects_code ON josenai_projects(project_code);
CREATE INDEX IF NOT EXISTS josenai_idx_projects_organization ON josenai_projects(organization_id);
CREATE INDEX IF NOT EXISTS josenai_idx_projects_active ON josenai_projects(is_active) WHERE is_active = TRUE;

-- ------------------------------------------------------------
-- 4. josenai_submissions テーブル
-- 提出情報（AI判定結果、Google Drive連携）
-- user_id, reviewed_by は auth.users(id) を直接参照
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS josenai_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES josenai_organizations(id),
    project_id UUID NOT NULL REFERENCES josenai_projects(id),
    submission_type TEXT NOT NULL CHECK (submission_type IN ('kikaku', 'koho')),
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
    reviewed_by UUID REFERENCES auth.users(id),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE josenai_submissions IS '提出情報（AI判定結果、審査状態を管理）';
COMMENT ON COLUMN josenai_submissions.submission_type IS '提出種別: kikaku=企画管理部宛, koho=広報部宛';
COMMENT ON COLUMN josenai_submissions.ai_risk_score IS 'AIリスクスコア（0-100）';
COMMENT ON COLUMN josenai_submissions.ai_risk_details IS 'AI指摘内容（JSONB形式）';
COMMENT ON COLUMN josenai_submissions.status IS '審査状態: pending=審査待ち, approved=承認, rejected=却下';
COMMENT ON COLUMN josenai_submissions.version IS '楽観的ロック用バージョン（更新時インクリメント）';

CREATE INDEX IF NOT EXISTS josenai_idx_submissions_user ON josenai_submissions(user_id);
CREATE INDEX IF NOT EXISTS josenai_idx_submissions_status ON josenai_submissions(status);
CREATE INDEX IF NOT EXISTS josenai_idx_submissions_type ON josenai_submissions(submission_type);
CREATE INDEX IF NOT EXISTS josenai_idx_submissions_created ON josenai_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS josenai_idx_submissions_reviewer ON josenai_submissions(reviewed_by) WHERE reviewed_by IS NOT NULL;

-- ------------------------------------------------------------
-- 5. josenai_media_specs テーブル
-- メディア規格マスタ
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS josenai_media_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_type TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    allowed_extensions TEXT[] NOT NULL,
    max_file_size_mb INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE josenai_media_specs IS 'メディア規格マスタ（許可ファイル形式、サイズ上限）';
COMMENT ON COLUMN josenai_media_specs.allowed_extensions IS '許可拡張子（配列形式）';

-- ------------------------------------------------------------
-- 6. josenai_check_items テーブル
-- AI判定チェック項目マスタ
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS josenai_check_items (
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

COMMENT ON TABLE josenai_check_items IS 'AI判定チェック項目マスタ';
COMMENT ON COLUMN josenai_check_items.category IS 'カテゴリ: prohibited=禁止事項(30点), copyright=著作権(15点), format=フォーマット(5点)';
COMMENT ON COLUMN josenai_check_items.risk_weight IS 'リスク重み: 30=重大, 15=中程度, 5=軽微';

CREATE INDEX IF NOT EXISTS josenai_idx_check_items_category ON josenai_check_items(category);
CREATE INDEX IF NOT EXISTS josenai_idx_check_items_active ON josenai_check_items(is_active) WHERE is_active = TRUE;

-- ------------------------------------------------------------
-- 7. josenai_rule_documents テーブル
-- 情宣ルール・ガイドライン文書マスタ
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS josenai_rule_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL CHECK (document_type IN ('josenai_rule', 'copyright_guideline', 'submission_guide')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE josenai_rule_documents IS '情宣ルール・ガイドライン文書';
COMMENT ON COLUMN josenai_rule_documents.document_type IS '文書種別: josenai_rule, copyright_guideline, submission_guide';

-- ------------------------------------------------------------
-- 8. josenai_app_settings テーブル
-- アプリケーション設定（キーバリュー形式）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS josenai_app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE josenai_app_settings IS 'アプリケーション設定（管理者パスワード、制限値等）';

-- ------------------------------------------------------------
-- トリガー: updated_at 自動更新
-- 共有プロジェクトに update_updated_at_column() が存在しない場合のみ作成
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION josenai_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER josenai_update_profiles_updated_at
    BEFORE UPDATE ON josenai_profiles
    FOR EACH ROW EXECUTE FUNCTION josenai_update_updated_at();

CREATE TRIGGER josenai_update_organizations_updated_at
    BEFORE UPDATE ON josenai_organizations
    FOR EACH ROW EXECUTE FUNCTION josenai_update_updated_at();

CREATE TRIGGER josenai_update_projects_updated_at
    BEFORE UPDATE ON josenai_projects
    FOR EACH ROW EXECUTE FUNCTION josenai_update_updated_at();

CREATE TRIGGER josenai_update_submissions_updated_at
    BEFORE UPDATE ON josenai_submissions
    FOR EACH ROW EXECUTE FUNCTION josenai_update_updated_at();

CREATE TRIGGER josenai_update_check_items_updated_at
    BEFORE UPDATE ON josenai_check_items
    FOR EACH ROW EXECUTE FUNCTION josenai_update_updated_at();

CREATE TRIGGER josenai_update_rule_documents_updated_at
    BEFORE UPDATE ON josenai_rule_documents
    FOR EACH ROW EXECUTE FUNCTION josenai_update_updated_at();

CREATE TRIGGER josenai_update_app_settings_updated_at
    BEFORE UPDATE ON josenai_app_settings
    FOR EACH ROW EXECUTE FUNCTION josenai_update_updated_at();

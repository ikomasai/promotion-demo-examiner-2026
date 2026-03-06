-- AI判定レポート Google Docs のカラムを josenai_submissions に追加
ALTER TABLE josenai_submissions
  ADD COLUMN IF NOT EXISTS docs_file_id TEXT,
  ADD COLUMN IF NOT EXISTS docs_file_url TEXT;

COMMENT ON COLUMN josenai_submissions.docs_file_id IS 'AI判定レポート Google Docs のファイルID';
COMMENT ON COLUMN josenai_submissions.docs_file_url IS 'AI判定レポート Google Docs の共有URL';

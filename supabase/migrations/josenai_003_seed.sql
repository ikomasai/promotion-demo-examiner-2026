-- ============================================================
-- josenai_003_seed.sql
-- 生駒祭 情宣AI判定システム - 初期データ投入
-- ============================================================
-- 作成日: 2026-01-25
-- 更新日: 2026-02-17 (共有Supabase移行: josenai_ プレフィックス追加,
--                     自動承認設定追加)
-- 説明: マスタデータの初期値
--       josenai_media_specs, josenai_check_items,
--       josenai_rule_documents, josenai_app_settings
-- ============================================================

-- ------------------------------------------------------------
-- josenai_media_specs: メディア規格マスタ
-- ------------------------------------------------------------
INSERT INTO josenai_media_specs (media_type, display_name, allowed_extensions, max_file_size_mb) VALUES
    ('poster_a1', 'ポスター（A1）', ARRAY['jpg', 'jpeg', 'png', 'pdf'], 50),
    ('poster_a2', 'ポスター（A2）', ARRAY['jpg', 'jpeg', 'png', 'pdf'], 30),
    ('poster_a3', 'ポスター（A3）', ARRAY['jpg', 'jpeg', 'png', 'pdf'], 20),
    ('flyer', 'ビラ・チラシ', ARRAY['jpg', 'jpeg', 'png', 'pdf'], 20),
    ('signage', 'デジタルサイネージ', ARRAY['jpg', 'jpeg', 'png', 'mp4'], 100),
    ('sns_image', 'SNS画像', ARRAY['jpg', 'jpeg', 'png', 'gif'], 10),
    ('sns_video', 'SNS動画', ARRAY['mp4', 'mov'], 100),
    ('other', 'その他', ARRAY['jpg', 'jpeg', 'png', 'pdf', 'mp4'], 50);

-- ------------------------------------------------------------
-- josenai_check_items: AI判定チェック項目
-- カテゴリ別リスク重み: prohibited=30, copyright=15, format=5
-- ------------------------------------------------------------

-- 禁止事項（リスク重み: 30）
INSERT INTO josenai_check_items (category, item_code, item_name, description, risk_weight, display_order) VALUES
    ('prohibited', 'PRH001', '反社会的表現', '暴力、差別、ヘイトスピーチ等の表現が含まれていないか', 30, 1),
    ('prohibited', 'PRH002', '法令違反', '法律に抵触する可能性のある表現がないか', 30, 2),
    ('prohibited', 'PRH003', '公序良俗違反', '公序良俗に反する表現がないか', 30, 3),
    ('prohibited', 'PRH004', '虚偽情報', '事実と異なる誤解を招く情報がないか', 30, 4),
    ('prohibited', 'PRH005', '個人情報露出', '許可なく個人を特定できる情報が含まれていないか', 30, 5),
    ('prohibited', 'PRH006', '大学規則違反', '近畿大学の規則に違反する内容がないか', 30, 6),
    ('prohibited', 'PRH007', '競合他社宣伝', '企業スポンサー以外の商業宣伝が含まれていないか', 30, 7),
    ('prohibited', 'PRH008', '政治的主張', '特定の政治的立場を支持する表現がないか', 30, 8);

-- 著作権関連（リスク重み: 15）
INSERT INTO josenai_check_items (category, item_code, item_name, description, risk_weight, display_order) VALUES
    ('copyright', 'CPR001', '画像著作権', '使用している画像の著作権は適切に処理されているか', 15, 1),
    ('copyright', 'CPR002', 'フォント著作権', '商用利用可能なフォントを使用しているか', 15, 2),
    ('copyright', 'CPR003', '音楽著作権', '動画に使用している音楽の著作権は適切か', 15, 3),
    ('copyright', 'CPR004', 'キャラクター使用', '他者のキャラクターを無断使用していないか', 15, 4),
    ('copyright', 'CPR005', 'ロゴ・商標', '他社のロゴや商標を無断使用していないか', 15, 5),
    ('copyright', 'CPR006', '二次創作', '二次創作物の場合、ガイドラインに準拠しているか', 15, 6);

-- フォーマット関連（リスク重み: 5）
INSERT INTO josenai_check_items (category, item_code, item_name, description, risk_weight, display_order) VALUES
    ('format', 'FMT001', '必須情報記載', '日時・場所・団体名等の必須情報が記載されているか', 5, 1),
    ('format', 'FMT002', '大学祭ロゴ', '生駒祭公式ロゴが適切に配置されているか', 5, 2),
    ('format', 'FMT003', '文字可読性', '文字サイズ・色が適切で読みやすいか', 5, 3),
    ('format', 'FMT004', '画像解像度', '印刷に耐えうる解像度か（300dpi以上推奨）', 5, 4),
    ('format', 'FMT005', 'ファイル形式', '指定されたファイル形式・サイズを満たしているか', 5, 5);

-- ------------------------------------------------------------
-- josenai_rule_documents: ルール文書
-- ------------------------------------------------------------
INSERT INTO josenai_rule_documents (document_type, title, content, version) VALUES
    ('josenai_rule', '情宣ルール', '# 生駒祭 2026 情宣ルール

## 1. 基本方針
- すべての情宣物は事前審査を受けること
- 大学祭実行委員会の承認なく掲示・配布しないこと

## 2. 禁止事項
- 反社会的表現
- 著作権侵害
- 虚偽情報の記載

## 3. 必須記載事項
- 団体名
- 企画名
- 日時・場所
- 生駒祭公式ロゴ

## 4. 審査フロー
1. 本システムでファイルをアップロード
2. AIによる自動判定
3. 担当部署による最終審査
4. 承認後、掲示・配布可能
', 1),
    ('copyright_guideline', '著作物取り扱いガイドライン', '# 著作物取り扱いガイドライン

## 1. 画像の使用
- フリー素材サイトから取得した画像は利用規約を確認
- 写真撮影時は被写体の許可を得ること
- SNSから取得した画像は原則使用禁止

## 2. フォントの使用
- Google Fonts等の無料フォント推奨
- 有料フォントは購入証明が必要

## 3. 音楽の使用（動画向け）
- 著作権フリー楽曲を使用
- JASRAC管理楽曲は許諾手続きが必要

## 4. 二次創作について
- 公式ガイドラインがある場合はそれに準拠
- ガイドラインがない場合は原則禁止
', 1),
    ('submission_guide', '提出ガイド', '# 提出ガイド

## 1. 提出前の確認事項
- ファイル形式が正しいか
- ファイルサイズが制限内か
- 必須情報がすべて記載されているか

## 2. サンドボックス機能
- 1日3回まで事前確認可能
- 本番提出前に必ず確認を推奨
- リスクスコアが高い場合は修正を

## 3. 本番提出
- リスクスコア0-10%: そのまま提出可能
- リスクスコア11-50%: 警告確認後に提出
- リスクスコア51-100%: 理由記入が必須

## 4. 審査後の流れ
- 承認: 掲示・配布OK
- 却下: 修正して再提出
', 1);

-- ------------------------------------------------------------
-- josenai_app_settings: アプリケーション設定
-- パスワードは bcrypt ハッシュ（デフォルト: admin123）
-- ------------------------------------------------------------
INSERT INTO josenai_app_settings (key, value, description) VALUES
    ('koho_admin_password_hash', '$2a$10$N8kGdaYX43HxMSAEJfklcuw/8nvAe7c2u6vaZ0xxp8Dz1YsdC9xHW', '広報部管理者パスワード（bcrypt）'),
    ('kikaku_admin_password_hash', '$2a$10$UMBRY0pFDYbgxpPij3aGN.ebpsP6tSKwRBuXbiUUOQIjs6RW8Opxq', '企画管理部管理者パスワード（bcrypt）'),
    ('super_admin_password_hash', '$2a$10$/JL9/64m/aLMPgGFIZJBB.ugEp2kTwfEm0DUiLo3kD7TDR1N//QW.', 'スーパー管理者パスワード（bcrypt）'),
    ('sandbox_daily_limit', '3', 'サンドボックス1日上限回数'),
    ('submission_enabled', 'true', '提出受付中フラグ'),
    ('ai_timeout_seconds', '30', 'AI判定タイムアウト秒数'),
    ('app_version', '1.0.0', 'アプリケーションバージョン'),
    ('auto_approve_enabled', 'false', '自動承認機能の有効/無効'),
    ('auto_approve_threshold', '10', '自動承認閾値（0-100）');

-- ------------------------------------------------------------
-- サンプル団体・企画データ（開発用）
-- ------------------------------------------------------------
INSERT INTO josenai_organizations (organization_code, organization_name, category) VALUES
    ('ORG001', '文化会演劇部', '文化会'),
    ('ORG002', '軽音楽部', '文化会'),
    ('ORG003', '写真部', '文化会'),
    ('ORG004', 'サッカー部', '体育会'),
    ('ORG005', '生駒祭実行委員会', '実行委員会');

INSERT INTO josenai_projects (project_code, project_name, organization_id) VALUES
    ('PRJ001', '秋公演「夢の続き」', (SELECT id FROM josenai_organizations WHERE organization_code = 'ORG001')),
    ('PRJ002', 'ライブステージ', (SELECT id FROM josenai_organizations WHERE organization_code = 'ORG002')),
    ('PRJ003', '写真展「光と影」', (SELECT id FROM josenai_organizations WHERE organization_code = 'ORG003')),
    ('PRJ004', 'フットサル大会', (SELECT id FROM josenai_organizations WHERE organization_code = 'ORG004')),
    ('PRJ005', 'オープニングセレモニー', (SELECT id FROM josenai_organizations WHERE organization_code = 'ORG005')),
    ('PRJ006', 'グランドフィナーレ', (SELECT id FROM josenai_organizations WHERE organization_code = 'ORG005'));

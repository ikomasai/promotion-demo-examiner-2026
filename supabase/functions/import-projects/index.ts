/**
 * @fileoverview 企画 CSV インポート Edge Function
 * @description CSV ファイルから企画マスタを一括 UPSERT。
 *              organization_code → organization_id の参照整合性チェック付き。
 * @module supabase/functions/import-projects
 */

import { withAuth } from '../_shared/middleware.ts';
import { withRetry } from '../_shared/retry.ts';
import { jsonResponse } from '../_shared/response.ts';
import { createUserClient } from '../_shared/auth.ts';

/** 必須ヘッダー（順序不問） */
const REQUIRED_HEADERS = ['project_code', 'project_name', 'organization_code'];

/**
 * CSV テキストを行ごとにパースし、オブジェクト配列を返す
 */
function parseCsv(text: string): Record<string, string>[] {
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length < 2) {
    throw new Error('CSVファイルにデータ行がありません');
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const missing = REQUIRED_HEADERS.filter((r) => !headers.includes(r));
  if (missing.length > 0) {
    throw new Error(`必須ヘッダーが不足しています: ${missing.join(', ')}`);
  }

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length !== headers.length) {
      throw new Error(
        `${i + 1}行目: カラム数がヘッダーと一致しません（期待: ${headers.length}, 実際: ${values.length}）`,
      );
    }

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });

    if (!row.project_code || !row.project_name || !row.organization_code) {
      throw new Error(
        `${i + 1}行目: project_code, project_name, organization_code は必須です`,
      );
    }

    rows.push(row);
  }

  return rows;
}

withAuth(async ({ req, supabaseAdmin }) => {
  // 管理者権限チェック
  const authHeader = req.headers.get('Authorization')!;
  const userClient = createUserClient(authHeader);
  const { data: isAdmin } = await userClient.rpc('fn_is_josenai_admin');
  if (!isAdmin) {
    return jsonResponse({ success: false, error: '管理者権限が必要です' }, 403);
  }

  // FormData からファイル取得
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return jsonResponse({ success: false, error: 'CSV ファイルが送信されていません' }, 400);
  }

  // CSV パース
  let rows: Record<string, string>[];
  try {
    const text = await file.text();
    rows = parseCsv(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
    return jsonResponse({ success: false, error: message }, 400);
  }

  // organization_code の一覧を抽出（重複除去）
  const orgCodes = [...new Set(rows.map((r) => r.organization_code))];

  // 参照先の団体を一括取得
  const { data: orgs, error: orgError } = await supabaseAdmin
    .from('josenai_organizations')
    .select('id, organization_code')
    .in('organization_code', orgCodes);

  if (orgError) {
    console.error('団体取得エラー:', orgError);
    return jsonResponse(
      { success: false, error: `団体データの取得に失敗しました: ${orgError.message}` },
      500,
    );
  }

  // organization_code → organization_id マッピング
  const orgMap = new Map<string, string>();
  for (const org of orgs ?? []) {
    orgMap.set(org.organization_code, org.id);
  }

  // 存在しない organization_code を検出
  const missingCodes = orgCodes.filter((code) => !orgMap.has(code));
  if (missingCodes.length > 0) {
    return jsonResponse(
      {
        success: false,
        error: `存在しない団体コードが含まれています: ${missingCodes.join(', ')}`,
      },
      400,
    );
  }

  // UPSERT 用データ構築
  const upsertData = rows.map((row) => ({
    project_code: row.project_code,
    project_name: row.project_name,
    organization_id: orgMap.get(row.organization_code)!,
    is_active: true,
    updated_at: new Date().toISOString(),
  }));

  // UPSERT 実行（ON CONFLICT project_code）
  const { data, error } = await withRetry(() =>
    supabaseAdmin
      .from('josenai_projects')
      .upsert(upsertData, { onConflict: 'project_code' })
      .select('id'),
  );

  if (error) {
    console.error('UPSERT エラー:', error);
    return jsonResponse({ success: false, error: `データベースエラー: ${error.message}` }, 500);
  }

  return jsonResponse({ success: true, count: data?.length ?? 0 });
});

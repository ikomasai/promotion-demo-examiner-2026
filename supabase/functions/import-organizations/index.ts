/**
 * @fileoverview 団体 CSV インポート Edge Function
 * @description CSV ファイルから団体マスタを一括 UPSERT。
 *              organization_code を UPSERT キーとし、同一コードは上書き。
 * @module supabase/functions/import-organizations
 */

import { withAuth } from '../_shared/middleware.ts';
import { withRetry } from '../_shared/retry.ts';
import { jsonResponse } from '../_shared/response.ts';
import { createUserClient } from '../_shared/auth.ts';

/** 必須ヘッダー（順序不問） */
const REQUIRED_HEADERS = ['organization_code', 'organization_name', 'category'];

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

    if (!row.organization_code || !row.organization_name) {
      throw new Error(`${i + 1}行目: organization_code と organization_name は必須です`);
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

  // UPSERT 用データ構築
  const upsertData = rows.map((row) => ({
    organization_code: row.organization_code,
    organization_name: row.organization_name,
    category: row.category || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  }));

  // UPSERT 実行（ON CONFLICT organization_code）
  const { data, error } = await withRetry(() =>
    supabaseAdmin
      .from('josenai_organizations')
      .upsert(upsertData, { onConflict: 'organization_code' })
      .select('id'),
  );

  if (error) {
    console.error('UPSERT エラー:', error);
    return jsonResponse({ success: false, error: `データベースエラー: ${error.message}` }, 500);
  }

  return jsonResponse({ success: true, count: data?.length ?? 0 });
});

/**
 * @fileoverview 企画 CSV インポート Edge Function
 * @description CSV ファイルから企画マスタを一括 UPSERT。
 *              organization_code → organization_id の参照整合性チェック付き。
 *              project_code を UPSERT キーとし、同一コードは上書き。
 * @module supabase/functions/import-projects
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { withRetry } from '../_shared/retry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      throw new Error(`${i + 1}行目: カラム数がヘッダーと一致しません（期待: ${headers.length}, 実際: ${values.length}）`);
    }

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });

    if (!row.project_code || !row.project_name || !row.organization_code) {
      throw new Error(`${i + 1}行目: project_code, project_name, organization_code は必須です`);
    }

    rows.push(row);
  }

  return rows;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 認証チェック
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: '認証が必要です' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 管理者権限チェック
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: isAdmin } = await userClient.rpc('fn_is_josenai_admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: '管理者権限が必要です' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FormData からファイル取得
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ success: false, error: 'CSV ファイルが送信されていません' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CSV パース
    const text = await file.text();
    const rows = parseCsv(text);

    // organization_code の一覧を抽出（重複除去）
    const orgCodes = [...new Set(rows.map((r) => r.organization_code))];

    // 参照先の団体を一括取得
    const { data: orgs, error: orgError } = await supabaseAdmin
      .from('josenai_organizations')
      .select('id, organization_code')
      .in('organization_code', orgCodes);

    if (orgError) {
      console.error('団体取得エラー:', orgError);
      return new Response(
        JSON.stringify({ success: false, error: `団体データの取得に失敗しました: ${orgError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      return new Response(
        JSON.stringify({
          success: false,
          error: `存在しない団体コードが含まれています: ${missingCodes.join(', ')}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // UPSERT 用データ構築（organization_code → organization_id に変換）
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
        .select('id')
    );

    if (error) {
      console.error('UPSERT エラー:', error);
      return new Response(
        JSON.stringify({ success: false, error: `データベースエラー: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, count: data?.length ?? 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('import-projects エラー:', err);
    const message = err instanceof Error ? err.message : '予期しないエラーが発生しました';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * @fileoverview 提出削除 Edge Function — Google Drive ファイル削除
 * @description 提出削除時に Google Drive 上のファイルをベストエフォートで削除。
 *              JWT 認証チェック後、driveClient.deleteFile() を呼び出す。
 * @module supabase/functions/delete-submission
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { getAccessToken, deleteFile } from '../_shared/driveClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // JWT 認証チェック
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '認証が必要です' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '認証に失敗しました' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // リクエストボディ
    const { driveFileId } = await req.json();

    if (!driveFileId) {
      return new Response(
        JSON.stringify({ error: 'driveFileId は必須です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 所有権チェック: DB に該当行が残っていて他ユーザーの物なら拒否
    const { data: row } = await supabaseAdmin
      .from('josenai_submissions')
      .select('user_id')
      .eq('drive_file_id', driveFileId)
      .maybeSingle();

    if (row && row.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: '権限がありません' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Drive ファイル削除
    const accessToken = await getAccessToken();
    await deleteFile(accessToken, driveFileId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('delete-submission error:', err);

    // drive_not_configured は設定未完了 — 正常系として扱う
    if (err.message === 'drive_not_configured') {
      return new Response(
        JSON.stringify({ success: true, note: 'Drive not configured, skipped' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Drive ファイルの削除に失敗しました' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

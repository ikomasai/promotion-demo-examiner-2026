/**
 * @fileoverview 提出削除 Edge Function — Google Drive ファイル削除
 * @description 提出削除時に Google Drive 上のファイルをベストエフォートで削除。
 *              JWT 認証チェック後、driveClient.deleteFile() を呼び出す。
 * @module supabase/functions/delete-submission
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { getAccessToken, deleteFile } from '../_shared/driveClient.ts';
import { handleCors } from '../_shared/cors.ts';
import { jsonResponse } from '../_shared/response.ts';
import { extractToken } from '../_shared/auth.ts';

serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // JWT 認証チェック
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: '認証が必要です' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      extractToken(authHeader),
    );

    if (authError || !user) {
      return jsonResponse({ error: '認証に失敗しました' }, 401);
    }

    // リクエストボディ
    const { driveFileId } = await req.json();

    if (!driveFileId) {
      return jsonResponse({ error: 'driveFileId は必須です' }, 400);
    }

    // 所有権チェック: DB に該当行が残っていて他ユーザーの物なら拒否
    const { data: row } = await supabaseAdmin
      .from('josenai_submissions')
      .select('user_id')
      .eq('drive_file_id', driveFileId)
      .maybeSingle();

    if (row && row.user_id !== user.id) {
      return jsonResponse({ error: '権限がありません' }, 403);
    }

    // Drive ファイル削除
    const accessToken = await getAccessToken();
    await deleteFile(accessToken, driveFileId);

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('delete-submission error:', err);

    // drive_not_configured は設定未完了 — 正常系として扱う
    if (err instanceof Error && err.message === 'drive_not_configured') {
      return jsonResponse({ success: true, note: 'Drive not configured, skipped' });
    }

    return jsonResponse({ error: 'Drive ファイルの削除に失敗しました' }, 500);
  }
});

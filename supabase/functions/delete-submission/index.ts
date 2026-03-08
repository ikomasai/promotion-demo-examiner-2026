/**
 * @fileoverview 提出削除 Edge Function — Google Drive ファイル削除
 * @description 提出削除時に Google Drive 上のファイルをベストエフォートで削除。
 *              JWT 認証チェック後、driveClient.deleteFile() を呼び出す。
 * @module supabase/functions/delete-submission
 */

import { withAuth } from '../_shared/middleware.ts';
import { jsonResponse } from '../_shared/response.ts';
import { getAccessToken, deleteFile } from '../_shared/driveClient.ts';

withAuth(async ({ user, req, supabaseAdmin }) => {
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
  try {
    const accessToken = await getAccessToken();
    await deleteFile(accessToken, driveFileId);
  } catch (err) {
    // drive_not_configured は設定未完了 — 正常系として扱う
    if (err instanceof Error && err.message === 'drive_not_configured') {
      return jsonResponse({ success: true, note: 'Drive not configured, skipped' });
    }
    console.error('delete-submission Drive エラー:', err);
    return jsonResponse({ error: 'Drive ファイルの削除に失敗しました' }, 500);
  }

  return jsonResponse({ success: true });
});

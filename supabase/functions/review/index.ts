/**
 * @fileoverview 審査 Edge Function — 楽観的ロック付き承認/却下
 * @description 管理者が提出を承認または却下する。
 *              JWT 認証 → 審査権限チェック（fn_is_josenai_koho/kikaku）
 *              → ステータス検証 → version チェック付き UPDATE。
 * @module supabase/functions/review
 */

import { withAuth } from '../_shared/middleware.ts';
import { withRetry } from '../_shared/retry.ts';
import { jsonResponse } from '../_shared/response.ts';
import { createUserClient } from '../_shared/auth.ts';

withAuth(async ({ user, req, supabaseAdmin }) => {
  const { submissionId, action, comment, version } = await req.json();

  // 入力バリデーション
  if (!submissionId || !action || version === undefined || version === null) {
    return jsonResponse({ error: 'submissionId, action, version は必須です' }, 400);
  }

  if (action !== 'approve' && action !== 'reject') {
    return jsonResponse({ error: "action は 'approve' または 'reject' を指定してください" }, 400);
  }

  if (action === 'reject' && (!comment || comment.trim() === '')) {
    return jsonResponse({ error: '却下時はコメントが必須です' }, 400);
  }

  // submission を取得
  const { data: submission, error: fetchError } = await supabaseAdmin
    .from('josenai_submissions')
    .select('id, status, version, submission_type, user_id')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) {
    return jsonResponse({ error: '提出が見つかりません' }, 404);
  }

  // 審査権限チェック
  const authHeader = req.headers.get('Authorization')!;
  const userClient = createUserClient(authHeader);
  let hasReviewPermission = false;

  if (submission.submission_type === 'koho') {
    const { data } = await userClient.rpc('fn_is_josenai_koho');
    hasReviewPermission = data === true;
  } else if (submission.submission_type === 'kikaku') {
    const { data } = await userClient.rpc('fn_is_josenai_kikaku');
    hasReviewPermission = data === true;
  }

  // admin は両方審査可能
  if (!hasReviewPermission) {
    const { data } = await userClient.rpc('fn_is_josenai_admin');
    hasReviewPermission = data === true;
  }

  if (!hasReviewPermission) {
    return jsonResponse({ error: '審査権限がありません' }, 403);
  }

  // ステータスチェック
  if (submission.status !== 'pending') {
    return jsonResponse({ error: 'この提出は既に審査済みです' }, 400);
  }

  // 楽観的ロック UPDATE
  const { data: updated, error: updateError } = await withRetry(() =>
    supabaseAdmin
      .from('josenai_submissions')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewer_comment: comment || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        version: submission.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .eq('version', version)
      .select('id')
      .single(),
  );

  if (updateError || !updated) {
    return jsonResponse({ error: 'version_conflict' }, 409);
  }

  return jsonResponse({ success: true, submissionId: updated.id });
}, { useAnon: true });

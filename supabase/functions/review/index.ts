/**
 * @fileoverview 審査 Edge Function — 楽観的ロック付き承認/却下
 * @description 管理者が提出を承認または却下する。
 *              JWT 認証 → 審査権限チェック（fn_is_josenai_koho/kikaku）
 *              → ステータス検証 → version チェック付き UPDATE。
 * @module supabase/functions/review
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { supabaseAdmin, supabaseAnon } from '../_shared/supabase.ts';
import { withRetry, errorResponse } from '../_shared/retry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** JSON レスポンスヘルパー */
function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. JWT 認証
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: '認証が必要です' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );

    if (authError || !user) {
      return jsonResponse({ error: '認証に失敗しました' }, 401);
    }

    // 2. リクエストボディ
    const { submissionId, action, comment, version } = await req.json();

    // 3. 入力バリデーション
    if (!submissionId || !action || version === undefined || version === null) {
      return jsonResponse({ error: 'submissionId, action, version は必須です' }, 400);
    }

    if (action !== 'approve' && action !== 'reject') {
      return jsonResponse({ error: "action は 'approve' または 'reject' を指定してください" }, 400);
    }

    if (action === 'reject' && (!comment || comment.trim() === '')) {
      return jsonResponse({ error: '却下時はコメントが必須です' }, 400);
    }

    // 4. submission を取得（supabaseAdmin で RLS バイパス）
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('josenai_submissions')
      .select('id, status, version, submission_type, user_id')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return jsonResponse({ error: '提出が見つかりません' }, 404);
    }

    // 5. 審査権限チェック
    //    ユーザーの JWT をセットした client で fn_is_josenai_koho/kikaku を呼び出す
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // submission_type に応じた権限関数を呼び出す
    let hasReviewPermission = false;

    if (submission.submission_type === 'koho') {
      const { data } = await userClient.rpc('fn_is_josenai_koho');
      hasReviewPermission = !!data;
    } else if (submission.submission_type === 'kikaku') {
      const { data } = await userClient.rpc('fn_is_josenai_kikaku');
      hasReviewPermission = !!data;
    }

    // admin は両方審査可能
    if (!hasReviewPermission) {
      const { data } = await userClient.rpc('fn_is_josenai_admin');
      hasReviewPermission = !!data;
    }

    if (!hasReviewPermission) {
      return jsonResponse({ error: '審査権限がありません' }, 403);
    }

    // 6. ステータスチェック
    if (submission.status !== 'pending') {
      return jsonResponse({ error: 'この提出は既に審査済みです' }, 400);
    }

    // 7. 楽観的ロック UPDATE
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
        .single()
    );

    if (updateError || !updated) {
      return jsonResponse({ error: 'version_conflict' }, 409);
    }

    return jsonResponse({ success: true, submissionId: updated.id }, 200);
  } catch (err) {
    console.error('review error:', err);
    return errorResponse('審査処理中にエラーが発生しました', 500, corsHeaders);
  }
});

/**
 * @fileoverview 正式提出 Edge Function
 * @description 情宣物の正式提出エンドポイント。
 *              precheck=true: AI判定のみ（Drive/DB保存なし）
 *              precheck=false: Drive アップロード → AI 判定 → DB INSERT → 自動承認判定
 * @module supabase/functions/submit
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { analyzeWithGemini, type GeminiResult } from '../_shared/geminiClient.ts';
import {
  getAccessToken,
  ensureFolder,
  uploadFile,
  shareFile,
  deleteFile,
} from '../_shared/driveClient.ts';

/** CORS ヘッダー */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * JSON レスポンスを生成
 */
function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request): Promise<Response> => {
  // CORS プリフライト対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. 認証: Authorization ヘッダーから JWT 検証
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: '認証が必要です' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: '認証に失敗しました' }, 401);
    }

    // 2. multipart フォームデータのパース
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const organizationId = formData.get('organizationId') as string | null;
    const projectId = formData.get('projectId') as string | null;
    const mediaType = formData.get('mediaType') as string | null;
    const submissionType = formData.get('submissionType') as string | null;
    const userComment = formData.get('userComment') as string | null;
    const precheckFlag = formData.get('precheck') as string | null;
    const isPrecheck = precheckFlag === 'true';

    if (!file || !organizationId || !projectId || !mediaType || !submissionType) {
      return jsonResponse({ error: '必須項目が不足しています' }, 400);
    }

    // 3. アプリ設定の取得
    const { data: settings } = await supabaseAdmin
      .from('josenai_app_settings')
      .select('key, value')
      .in('key', ['submission_enabled', 'ai_timeout_seconds', 'auto_approve_enabled', 'auto_approve_threshold']);

    const settingsMap = new Map((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]));
    const timeoutSeconds = parseInt(settingsMap.get('ai_timeout_seconds') ?? '30', 10);

    // 4. 提出受付チェック
    const submissionEnabled = settingsMap.get('submission_enabled') !== 'false';
    if (!submissionEnabled) {
      return jsonResponse({ error: '現在、提出受付を停止しています' }, 403);
    }

    // 5. ファイルをバイト配列に変換
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = file.type || 'application/octet-stream';

    // ─── precheck モード: AI 判定のみ ───
    if (isPrecheck) {
      // チェック項目取得
      const { data: checkItems, error: checkError } = await supabaseAdmin
        .from('josenai_check_items')
        .select('item_code, item_name, description, category, risk_weight')
        .eq('is_active', true)
        .order('category')
        .order('display_order');

      if (checkError || !checkItems?.length) {
        return jsonResponse({ error: 'チェック項目の取得に失敗しました' }, 500);
      }

      // AI 判定（タイムアウト付き）
      let result: GeminiResult;
      try {
        const timeoutPromise = new Promise<GeminiResult>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutSeconds * 1000)
        );
        result = await Promise.race([
          analyzeWithGemini(fileBytes, mimeType, checkItems),
          timeoutPromise,
        ]);
      } catch (err) {
        const reason = err instanceof Error && err.message === 'timeout' ? 'timeout' : 'api_error';
        console.error('AI判定エラー (precheck):', err);
        result = {
          skipped: true,
          reason,
          ai_risk_score: null,
          ai_risk_details: null,
        };
      }

      return jsonResponse({
        ai_risk_score: result.ai_risk_score,
        ai_risk_details: result.ai_risk_details,
        skipped: result.skipped,
        reason: result.reason ?? null,
      });
    }

    // ─── 正式提出モード: Drive + AI + DB + 自動承認 ───

    // 6. 団体名取得（Drive フォルダパスに使用）
    const { data: org, error: orgError } = await supabaseAdmin
      .from('josenai_organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return jsonResponse({ error: '団体情報の取得に失敗しました' }, 404);
    }

    // 7. Google Drive アップロード
    let driveFileId: string | null = null;
    let driveFileUrl: string | null = null;

    try {
      const accessToken = await getAccessToken();
      const rootFolderId = Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID');
      if (!rootFolderId) {
        return jsonResponse({ error: 'Google Drive が設定されていません' }, 500);
      }

      // フォルダパス構築
      const folderPath = submissionType === 'kikaku'
        ? ['生駒祭2026', '企画物', org.name]
        : ['生駒祭2026', 'SNS', org.name];

      const folderId = await ensureFolder(accessToken, folderPath, rootFolderId);
      driveFileId = await uploadFile(accessToken, fileBytes, mimeType, file.name, folderId);
      driveFileUrl = await shareFile(accessToken, driveFileId);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Drive アップロードエラー:', errMsg);

      if (errMsg === 'drive_not_configured' || errMsg === 'drive_token_error') {
        return jsonResponse({ error: 'Google Drive が設定されていません' }, 500);
      }
      return jsonResponse({ error: 'ファイルのアップロードに失敗しました' }, 500);
    }

    // 8. AI 判定（タイムアウト付き）
    const { data: checkItems, error: checkError } = await supabaseAdmin
      .from('josenai_check_items')
      .select('item_code, item_name, description, category, risk_weight')
      .eq('is_active', true)
      .order('category')
      .order('display_order');

    let aiResult: GeminiResult;
    if (checkError || !checkItems?.length) {
      console.error('チェック項目取得失敗、AI判定をスキップ');
      aiResult = { skipped: true, reason: 'api_error', ai_risk_score: null, ai_risk_details: null };
    } else {
      try {
        const timeoutPromise = new Promise<GeminiResult>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutSeconds * 1000)
        );
        aiResult = await Promise.race([
          analyzeWithGemini(fileBytes, mimeType, checkItems),
          timeoutPromise,
        ]);
      } catch (err) {
        const reason = err instanceof Error && err.message === 'timeout' ? 'timeout' : 'api_error';
        console.error('AI判定エラー:', err);
        aiResult = { skipped: true, reason, ai_risk_score: null, ai_risk_details: null };
      }
    }

    // 9. DB INSERT (josenai_submissions)
    const { data: submission, error: insertError } = await supabaseAdmin
      .from('josenai_submissions')
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        project_id: projectId,
        submission_type: submissionType,
        media_type: mediaType,
        file_name: file.name,
        file_size: fileBytes.length,
        mime_type: mimeType,
        drive_file_id: driveFileId,
        drive_file_url: driveFileUrl,
        ai_risk_score: aiResult.ai_risk_score,
        ai_risk_details: aiResult.ai_risk_details,
        ai_skipped: aiResult.skipped,
        ai_skip_reason: aiResult.reason ?? null,
        user_comment: userComment || null,
        status: 'pending',
        version: 1,
      })
      .select('id')
      .single();

    if (insertError || !submission) {
      console.error('DB INSERT エラー:', insertError);
      // ロールバック: Drive ファイル削除（ベストエフォート）
      if (driveFileId) {
        try {
          const accessToken = await getAccessToken();
          await deleteFile(accessToken, driveFileId);
          console.log('ロールバック: Drive ファイル削除成功', driveFileId);
        } catch (rollbackErr) {
          console.error('ロールバック: Drive ファイル削除失敗', rollbackErr);
        }
      }
      return jsonResponse({ error: '提出データの保存に失敗しました' }, 500);
    }

    // 10. 自動承認判定
    let autoApproved = false;
    const autoApproveEnabled = settingsMap.get('auto_approve_enabled') === 'true';
    const autoApproveThreshold = parseInt(settingsMap.get('auto_approve_threshold') ?? '10', 10);

    if (
      autoApproveEnabled &&
      aiResult.ai_risk_score !== null &&
      aiResult.ai_risk_score <= autoApproveThreshold
    ) {
      const { error: approveError } = await supabaseAdmin
        .from('josenai_submissions')
        .update({
          status: 'approved',
          reviewer_comment: `自動承認（リスクスコア ${aiResult.ai_risk_score}% ≤ 閾値 ${autoApproveThreshold}%）`,
        })
        .eq('id', submission.id);

      if (!approveError) {
        autoApproved = true;
      } else {
        console.error('自動承認の更新に失敗:', approveError);
      }
    }

    // 11. レスポンス
    return jsonResponse({
      success: true,
      submission_id: submission.id,
      ai_risk_score: aiResult.ai_risk_score,
      ai_risk_details: aiResult.ai_risk_details,
      skipped: aiResult.skipped,
      reason: aiResult.reason ?? null,
      auto_approved: autoApproved,
    });
  } catch (err) {
    console.error('submit Edge Function エラー:', err);
    return jsonResponse({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

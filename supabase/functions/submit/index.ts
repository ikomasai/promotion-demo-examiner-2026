/**
 * @fileoverview 正式提出 Edge Function
 * @description 情宣物の正式提出エンドポイント。
 *              precheck=true: AI判定のみ（Drive/DB保存なし）
 *              precheck=false: AI 判定 → Drive アップロード → DB INSERT → 自動承認判定
 * @module supabase/functions/submit
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { analyzeWithTimeout, type GeminiResult } from '../_shared/geminiClient.ts';
import { withRetry } from '../_shared/retry.ts';
import { handleCors } from '../_shared/cors.ts';
import { jsonResponse } from '../_shared/response.ts';
import { extractToken } from '../_shared/auth.ts';
import { fetchActiveCheckItems } from '../_shared/checkItems.ts';
import {
  getAccessToken,
  ensureFolder,
  uploadFile,
  shareFile,
  deleteFile,
} from '../_shared/driveClient.ts';

serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 1. 認証: Authorization ヘッダーから JWT 検証
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: '認証が必要です' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(extractToken(authHeader));

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
    const { data: settings } = await withRetry(() =>
      supabaseAdmin
        .from('josenai_app_settings')
        .select('key, value')
        .in('key', [
          'submission_enabled',
          'ai_timeout_seconds',
          'auto_approve_enabled',
          'auto_approve_threshold',
        ]),
    );

    const settingsMap = new Map(
      (settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]),
    );
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
      const checkItems = await fetchActiveCheckItems(supabaseAdmin);
      if (!checkItems) {
        return jsonResponse({ error: 'チェック項目の取得に失敗しました' }, 500);
      }

      const result = await analyzeWithTimeout(fileBytes, mimeType, checkItems, timeoutSeconds);

      return jsonResponse({
        ai_risk_score: result.ai_risk_score,
        ai_risk_details: result.ai_risk_details,
        skipped: result.skipped,
        reason: result.reason ?? null,
      });
    }

    // ─── 正式提出モード: AI 判定 → Drive アップロード → DB + 自動承認 ───

    // 6. 団体名取得（Drive フォルダパス・ファイル名に使用）
    const { data: org, error: orgError } = await supabaseAdmin
      .from('josenai_organizations')
      .select('organization_name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return jsonResponse({ error: '団体情報の取得に失敗しました' }, 404);
    }

    // 7. 企画名取得（Drive ファイル名に使用）
    const { data: proj, error: projError } = await supabaseAdmin
      .from('josenai_projects')
      .select('project_name')
      .eq('id', projectId)
      .single();

    if (projError || !proj) {
      return jsonResponse({ error: '企画情報の取得に失敗しました' }, 404);
    }

    // 8. AI 判定（タイムアウト付き） ※ スコアをファイル名に含めるため Drive アップロード前に実行
    const checkItems = await fetchActiveCheckItems(supabaseAdmin);
    let aiResult: GeminiResult;
    if (!checkItems) {
      console.error('チェック項目取得失敗、AI判定をスキップ');
      aiResult = { skipped: true, reason: 'api_error', ai_risk_score: null, ai_risk_details: null };
    } else {
      aiResult = await analyzeWithTimeout(fileBytes, mimeType, checkItems, timeoutSeconds);
    }

    // 9. Drive ファイル名構築: 団体名-企画名-提出先-(スコア%).拡張子
    const destLabel = submissionType === 'kikaku' ? '企画管理部' : '広報部';
    const scoreLabel =
      aiResult.ai_risk_score !== null ? `(${aiResult.ai_risk_score}%)` : '(判定なし)';
    const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
    const sanitize = (s: string) => s.replace(/[\/\\:*?"<>|]/g, '_');
    const driveFileName = `${sanitize(org.organization_name)}-${sanitize(proj.project_name)}-${sanitize(destLabel)}-${scoreLabel}${ext}`;

    // 10. Google Drive アップロード
    let driveFileId: string | null = null;
    let driveFileUrl: string | null = null;

    try {
      const accessToken = await getAccessToken();
      const rootFolderId = Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID');
      if (!rootFolderId) {
        return jsonResponse({ error: 'Google Drive が設定されていません' }, 500);
      }

      // フォルダパス構築
      const folderPath =
        submissionType === 'kikaku'
          ? ['生駒祭2026', '企画物', org.organization_name]
          : ['生駒祭2026', 'SNS', org.organization_name];

      const folderId = await ensureFolder(accessToken, folderPath, rootFolderId);
      driveFileId = await uploadFile(accessToken, fileBytes, mimeType, driveFileName, folderId);
      driveFileUrl = await shareFile(accessToken, driveFileId);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Drive アップロードエラー:', errMsg);

      if (errMsg === 'drive_not_configured' || errMsg === 'drive_token_error') {
        return jsonResponse({ error: 'Google Drive が設定されていません' }, 500);
      }
      return jsonResponse({ error: 'ファイルのアップロードに失敗しました' }, 500);
    }

    // 11. DB INSERT (josenai_submissions)
    const { data: submission, error: insertError } = await withRetry(() =>
      supabaseAdmin
        .from('josenai_submissions')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          project_id: projectId,
          submission_type: submissionType,
          media_type: mediaType,
          file_name: file.name,
          file_size_bytes: fileBytes.length,
          drive_file_id: driveFileId,
          drive_file_url: driveFileUrl,
          ai_risk_score: aiResult.ai_risk_score,
          ai_risk_details: aiResult.ai_risk_details,
          user_comment: userComment || null,
          status: 'pending',
          version: 1,
        })
        .select('id')
        .single(),
    );

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

    // 12. 自動承認判定
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
          reviewed_at: new Date().toISOString(),
          reviewed_by: null,
          reviewer_comment: `システム自動承認: AIリスクスコア ${aiResult.ai_risk_score}% (閾値: ${autoApproveThreshold}%)`,
          version: 2,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (!approveError) {
        autoApproved = true;
      } else {
        console.error('自動承認の更新に失敗:', approveError);
      }
    }

    // 13. レスポンス
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

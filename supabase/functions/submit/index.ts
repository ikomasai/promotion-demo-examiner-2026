/**
 * @fileoverview 正式提出 Edge Function
 * @description 情宣物の正式提出エンドポイント。
 *              precheck=true: AI判定のみ（Drive/DB保存なし）
 *              precheck=false: AI 判定 → Drive アップロード → DB INSERT → 自動承認判定
 *
 *              処理ステップを関数に分離し、各ステップの失敗を適切にハンドリングする。
 * @module supabase/functions/submit
 */

import { withAuth, type AuthContext } from '../_shared/middleware.ts';
import { analyzeWithTimeout, type GeminiResult } from '../_shared/geminiClient.ts';
import { withRetry } from '../_shared/retry.ts';
import { jsonResponse } from '../_shared/response.ts';
import { fetchActiveCheckItems } from '../_shared/checkItems.ts';
import {
  getAccessToken,
  ensureFolder,
  uploadFile,
  shareFile,
  deleteFile,
} from '../_shared/driveClient.ts';
import { createReportDoc } from '../_shared/docsClient.ts';

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── 型定義 ───

interface FormInput {
  file: File;
  organizationId: string;
  projectId: string;
  mediaType: string;
  submissionType: string;
  userComment: string | null;
  isPrecheck: boolean;
}

interface OrgProject {
  orgName: string;
  projName: string;
}

interface DriveResult {
  driveFileId: string;
  driveFileUrl: string;
  accessToken: string;
  folderId: string;
}

interface DocsResult {
  docsFileId: string | null;
  docsFileUrl: string | null;
}

interface SettingsMap {
  get(key: string): string | undefined;
}

// ─── ステップ関数 ───

/** フォームデータのパース・バリデーション */
function parseFormData(formData: FormData): FormInput | Response {
  const file = formData.get('file') as File | null;
  const organizationId = formData.get('organizationId') as string | null;
  const projectId = formData.get('projectId') as string | null;
  const mediaType = formData.get('mediaType') as string | null;
  const submissionType = formData.get('submissionType') as string | null;
  const userComment = formData.get('userComment') as string | null;
  const precheckFlag = formData.get('precheck') as string | null;

  if (!file || !organizationId || !projectId || !mediaType || !submissionType) {
    return jsonResponse({ error: '必須項目が不足しています' }, 400);
  }

  return {
    file,
    organizationId,
    projectId,
    mediaType,
    submissionType,
    userComment,
    isPrecheck: precheckFlag === 'true',
  };
}

/** アプリ設定の取得 */
async function fetchSettings(db: SupabaseClient): Promise<SettingsMap> {
  const { data: settings } = await withRetry(() =>
    db
      .from('josenai_app_settings')
      .select('key, value')
      .in('key', [
        'submission_enabled',
        'ai_timeout_seconds',
        'auto_approve_enabled',
        'auto_approve_threshold',
      ]),
  );

  return new Map(
    (settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]),
  );
}

/** 団体・企画名の取得 */
async function fetchOrgProject(
  db: SupabaseClient,
  organizationId: string,
  projectId: string,
): Promise<OrgProject | Response> {
  const { data: org, error: orgError } = await db
    .from('josenai_organizations')
    .select('organization_name')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    return jsonResponse({ error: '団体情報の取得に失敗しました' }, 404);
  }

  const { data: proj, error: projError } = await db
    .from('josenai_projects')
    .select('project_name')
    .eq('id', projectId)
    .single();

  if (projError || !proj) {
    return jsonResponse({ error: '企画情報の取得に失敗しました' }, 404);
  }

  return { orgName: org.organization_name, projName: proj.project_name };
}

/** AI 判定実行 */
async function runAIAnalysis(
  fileBytes: Uint8Array,
  mimeType: string,
  db: SupabaseClient,
  timeoutSeconds: number,
): Promise<GeminiResult> {
  const checkItems = await fetchActiveCheckItems(db);
  if (!checkItems) {
    console.error('チェック項目取得失敗、AI判定をスキップ');
    return { skipped: true, reason: 'api_error', ai_risk_score: null, ai_risk_details: null };
  }
  return await analyzeWithTimeout(fileBytes, mimeType, checkItems, timeoutSeconds);
}

/** Drive ファイル名構築 */
function buildDriveFileName(
  orgName: string,
  projName: string,
  submissionType: string,
  aiResult: GeminiResult,
  originalFileName: string,
): string {
  const destLabel = submissionType === 'kikaku' ? '企画管理部' : '広報部';
  const scoreLabel =
    aiResult.ai_risk_score !== null ? `(${aiResult.ai_risk_score}%)` : '(判定なし)';
  const ext = originalFileName.includes('.')
    ? originalFileName.substring(originalFileName.lastIndexOf('.'))
    : '';
  const sanitize = (s: string) => s.replace(/[\/\\:*?"<>|]/g, '_');
  return `${sanitize(orgName)}-${sanitize(projName)}-${sanitize(destLabel)}-${scoreLabel}${ext}`;
}

/** Google Drive アップロード */
async function uploadToDrive(
  fileBytes: Uint8Array,
  mimeType: string,
  driveFileName: string,
  orgName: string,
  submissionType: string,
): Promise<DriveResult> {
  const accessToken = await getAccessToken();
  const rootFolderId = Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID');
  if (!rootFolderId) {
    throw new Error('drive_not_configured');
  }

  const folderPath =
    submissionType === 'kikaku'
      ? ['生駒祭2026', '企画物', orgName]
      : ['生駒祭2026', 'SNS', orgName];

  const folderId = await ensureFolder(accessToken, folderPath, rootFolderId);
  const driveFileId = await uploadFile(accessToken, fileBytes, mimeType, driveFileName, folderId);
  const driveFileUrl = await shareFile(accessToken, driveFileId);

  return { driveFileId, driveFileUrl, accessToken, folderId };
}

/** Docs レポート作成（失敗しても提出は継続） */
async function createDocsReport(
  accessToken: string,
  folderId: string,
  orgName: string,
  projName: string,
  submissionType: string,
  submitterEmail: string,
  aiResult: GeminiResult,
  driveFileUrl: string | null,
  db: SupabaseClient,
): Promise<DocsResult> {
  try {
    const checkItems = await fetchActiveCheckItems(db);
    const destLabel = submissionType === 'kikaku' ? '企画管理部' : '広報部';
    const scoreLabel =
      aiResult.ai_risk_score !== null ? `(${aiResult.ai_risk_score}%)` : '(判定なし)';
    const sanitize = (s: string) => s.replace(/[\/\\:*?"<>|]/g, '_');
    const docsTitle = `[AI判定] ${sanitize(orgName)}-${sanitize(projName)}-${sanitize(destLabel)}-${scoreLabel}`;

    const result = await createReportDoc(accessToken, {
      title: docsTitle,
      orgName,
      projName,
      submissionType,
      submitterEmail,
      submittedAt: new Date().toISOString(),
      aiRiskScore: aiResult.ai_risk_score,
      aiRiskDetails: aiResult.ai_risk_details,
      checkItems: checkItems ?? [],
      skipped: aiResult.skipped,
      skipReason: aiResult.reason,
      driveFileUrl,
      folderId,
    });
    return { docsFileId: result.docsId, docsFileUrl: result.docsUrl };
  } catch (docsErr) {
    // #5 サイレントフェイル修正: エラー詳細をログに出力（提出は継続）
    const errMsg = docsErr instanceof Error ? docsErr.message : String(docsErr);
    console.error(`Docs レポート作成エラー（提出は継続）: ${errMsg}`);
    return { docsFileId: null, docsFileUrl: null };
  }
}

/** DB INSERT + ロールバック */
async function insertSubmission(
  db: SupabaseClient,
  params: {
    userId: string;
    input: FormInput;
    fileBytes: Uint8Array;
    driveResult: DriveResult;
    docsResult: DocsResult;
    aiResult: GeminiResult;
  },
): Promise<{ submissionId: string } | Response> {
  const { userId, input, fileBytes, driveResult, docsResult, aiResult } = params;

  const { data: submission, error: insertError } = await withRetry(() =>
    db
      .from('josenai_submissions')
      .insert({
        user_id: userId,
        organization_id: input.organizationId,
        project_id: input.projectId,
        submission_type: input.submissionType,
        media_type: input.mediaType,
        file_name: input.file.name,
        file_size_bytes: fileBytes.length,
        drive_file_id: driveResult.driveFileId,
        drive_file_url: driveResult.driveFileUrl,
        docs_file_id: docsResult.docsFileId,
        docs_file_url: docsResult.docsFileUrl,
        ai_risk_score: aiResult.ai_risk_score,
        ai_risk_details: aiResult.ai_risk_details,
        user_comment: input.userComment || null,
        status: 'pending',
        version: 1,
      })
      .select('id')
      .single(),
  );

  if (insertError || !submission) {
    console.error('DB INSERT エラー:', insertError);
    // ロールバック: Drive ファイル削除（ベストエフォート）
    try {
      const token = await getAccessToken();
      await deleteFile(token, driveResult.driveFileId);
      console.log('ロールバック: Drive ファイル削除成功', driveResult.driveFileId);
    } catch (rollbackErr) {
      // #5 サイレントフェイル修正: ロールバック失敗も詳細ログ
      const errMsg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
      console.error(`ロールバック: Drive ファイル削除失敗 (fileId=${driveResult.driveFileId}): ${errMsg}`);
    }
    return jsonResponse({ error: '提出データの保存に失敗しました' }, 500);
  }

  return { submissionId: submission.id };
}

/** 自動承認判定 */
async function tryAutoApprove(
  db: SupabaseClient,
  submissionId: string,
  aiResult: GeminiResult,
  settingsMap: SettingsMap,
): Promise<boolean> {
  const autoApproveEnabled = settingsMap.get('auto_approve_enabled') === 'true';
  const autoApproveThreshold = parseInt(settingsMap.get('auto_approve_threshold') ?? '10', 10);

  if (
    !autoApproveEnabled ||
    aiResult.ai_risk_score === null ||
    aiResult.ai_risk_score > autoApproveThreshold
  ) {
    return false;
  }

  const { error: approveError } = await db
    .from('josenai_submissions')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: null,
      reviewer_comment: `システム自動承認: AIリスクスコア ${aiResult.ai_risk_score}% (閾値: ${autoApproveThreshold}%)`,
      version: 2,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (approveError) {
    console.error('自動承認の更新に失敗:', approveError);
    return false;
  }
  return true;
}

// ─── メインハンドラー ───

withAuth(async ({ user, req, supabaseAdmin: db }) => {
  // 1. フォームデータのパース
  const formData = await req.formData();
  const parsed = parseFormData(formData);
  if (parsed instanceof Response) return parsed;
  const input = parsed;

  // 2. アプリ設定の取得
  const settingsMap = await fetchSettings(db);
  const timeoutSeconds = parseInt(settingsMap.get('ai_timeout_seconds') ?? '30', 10);

  // 3. 提出受付チェック
  if (settingsMap.get('submission_enabled') === 'false') {
    return jsonResponse({ error: '現在、提出受付を停止しています' }, 403);
  }

  // 4. ファイルをバイト配列に変換
  const fileBytes = new Uint8Array(await input.file.arrayBuffer());
  const mimeType = input.file.type || 'application/octet-stream';

  // ─── precheck モード: AI 判定のみ ───
  if (input.isPrecheck) {
    const checkItems = await fetchActiveCheckItems(db);
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

  // ─── 正式提出モード ───

  // 5. 団体・企画名取得
  const orgProject = await fetchOrgProject(db, input.organizationId, input.projectId);
  if (orgProject instanceof Response) return orgProject;

  // 6. AI 判定
  const aiResult = await runAIAnalysis(fileBytes, mimeType, db, timeoutSeconds);

  // 7. Drive ファイル名構築 + アップロード
  const driveFileName = buildDriveFileName(
    orgProject.orgName,
    orgProject.projName,
    input.submissionType,
    aiResult,
    input.file.name,
  );

  let driveResult: DriveResult;
  try {
    driveResult = await uploadToDrive(
      fileBytes,
      mimeType,
      driveFileName,
      orgProject.orgName,
      input.submissionType,
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Drive アップロードエラー:', errMsg);
    if (errMsg === 'drive_not_configured' || errMsg === 'drive_token_error') {
      return jsonResponse({ error: 'Google Drive が設定されていません' }, 500);
    }
    return jsonResponse({ error: 'ファイルのアップロードに失敗しました' }, 500);
  }

  // 8. Docs レポート作成
  const docsResult = await createDocsReport(
    driveResult.accessToken,
    driveResult.folderId,
    orgProject.orgName,
    orgProject.projName,
    input.submissionType,
    user.email ?? '',
    aiResult,
    driveResult.driveFileUrl,
    db,
  );

  // 9. DB INSERT
  const insertResult = await insertSubmission(db, {
    userId: user.id,
    input,
    fileBytes,
    driveResult,
    docsResult,
    aiResult,
  });
  if (insertResult instanceof Response) return insertResult;

  // 10. 自動承認判定
  const autoApproved = await tryAutoApprove(
    db,
    insertResult.submissionId,
    aiResult,
    settingsMap,
  );

  // 11. レスポンス
  return jsonResponse({
    success: true,
    submission_id: insertResult.submissionId,
    ai_risk_score: aiResult.ai_risk_score,
    ai_risk_details: aiResult.ai_risk_details,
    skipped: aiResult.skipped,
    reason: aiResult.reason ?? null,
    auto_approved: autoApproved,
    docs_url: docsResult.docsFileUrl,
  });
});

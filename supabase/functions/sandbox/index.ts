/**
 * @fileoverview サンドボックス Edge Function
 * @description AI判定を事前に試行できるエンドポイント（1日3回まで、データ保存なし）。
 *              認証 → 日次制限チェック → Gemini AI 判定 → カウント更新 → 結果返却。
 * @module supabase/functions/sandbox
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { analyzeWithTimeout } from '../_shared/geminiClient.ts';
import { withRetry } from '../_shared/retry.ts';
import { handleCors } from '../_shared/cors.ts';
import { jsonResponse } from '../_shared/response.ts';
import { extractToken } from '../_shared/auth.ts';
import { fetchActiveCheckItems } from '../_shared/checkItems.ts';

/**
 * JST での本日の日付を YYYY-MM-DD 形式で取得
 */
function getTodayJST(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 1. 認証: Authorization ヘッダーから JWT 検証
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

    // 2. multipart フォームデータのパース
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const organizationId = formData.get('organizationId') as string | null;
    const projectId = formData.get('projectId') as string | null;
    const mediaType = formData.get('mediaType') as string | null;
    const submissionType = formData.get('submissionType') as string | null;

    if (!file || !organizationId || !projectId || !mediaType || !submissionType) {
      return jsonResponse({ error: '必須項目が不足しています' }, 400);
    }

    // 3. アプリ設定の取得
    const { data: settings } = await withRetry(() =>
      supabaseAdmin
        .from('josenai_app_settings')
        .select('key, value')
        .in('key', ['sandbox_daily_limit', 'ai_timeout_seconds'])
    );

    const settingsMap = new Map((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]));
    const dailyLimit = parseInt(settingsMap.get('sandbox_daily_limit') ?? '3', 10);
    const timeoutSeconds = parseInt(settingsMap.get('ai_timeout_seconds') ?? '30', 10);

    // 4. プロフィール取得＋日次リセット判定
    const { data: profile, error: profileError } = await withRetry(() =>
      supabaseAdmin
        .from('josenai_profiles')
        .select('sandbox_count_today, sandbox_count_date')
        .eq('user_id', user.id)
        .single()
    );

    if (profileError || !profile) {
      return jsonResponse({ error: 'プロフィールが見つかりません' }, 404);
    }

    const todayJST = getTodayJST();
    const effectiveCount = profile.sandbox_count_date === todayJST
      ? profile.sandbox_count_today
      : 0;

    // 5. 日次制限チェック
    if (effectiveCount >= dailyLimit) {
      return jsonResponse({
        error: '本日のサンドボックス利用上限に達しました',
        remaining_today: 0,
      }, 429);
    }

    // 6. チェック項目取得
    const checkItems = await fetchActiveCheckItems(supabaseAdmin);
    if (!checkItems) {
      return jsonResponse({ error: 'チェック項目の取得に失敗しました' }, 500);
    }

    // 7. ファイルをバイト配列に変換
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = file.type || 'application/octet-stream';

    // 8. Gemini AI 判定（タイムアウト付き）
    const result = await analyzeWithTimeout(fileBytes, mimeType, checkItems, timeoutSeconds);

    // 9. カウント更新（アトミック UPDATE）
    const newCount = effectiveCount + 1;
    await withRetry(() =>
      supabaseAdmin
        .from('josenai_profiles')
        .update({
          sandbox_count_today: newCount,
          sandbox_count_date: todayJST,
        })
        .eq('user_id', user.id)
    );

    // 10. レスポンス返却
    return jsonResponse({
      ai_risk_score: result.ai_risk_score,
      ai_risk_details: result.ai_risk_details,
      skipped: result.skipped,
      reason: result.reason ?? null,
      remaining_today: dailyLimit - newCount,
    });
  } catch (err) {
    console.error('sandbox Edge Function エラー:', err);
    return jsonResponse({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

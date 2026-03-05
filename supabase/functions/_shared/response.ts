/**
 * @fileoverview JSON レスポンス生成の共有モジュール
 * @module supabase/functions/_shared/response
 */

import { corsHeaders } from './cors.ts';

/**
 * 標準化された JSON レスポンスを生成
 * @param body レスポンスボディ
 * @param status HTTP ステータスコード（デフォルト: 200）
 */
export function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

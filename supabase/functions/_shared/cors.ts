/**
 * @fileoverview CORS ヘッダーとプリフライト処理の共有モジュール
 * @module supabase/functions/_shared/cors
 */

/** 全 Edge Functions 共通の CORS ヘッダー */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CORS プリフライトリクエストの場合にレスポンスを返す
 * @returns プリフライトなら Response、そうでなければ null
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

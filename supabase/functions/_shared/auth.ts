/**
 * @fileoverview 認証ヘルパーの共有モジュール
 * @module supabase/functions/_shared/auth
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Authorization ヘッダーから Bearer トークンを抽出
 */
export function extractToken(authHeader: string): string {
  return authHeader.replace('Bearer ', '');
}

/**
 * ユーザーの JWT を使った Supabase クライアントを生成（RLS 適用）
 * @param authHeader Authorization ヘッダー値（"Bearer xxx"）
 */
export function createUserClient(authHeader: string): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
}

/** 管理者パスワードの設定キー名マッピング（adminConfig.ts から再エクスポート） */
export { PASSWORD_KEYS } from './adminConfig.ts';

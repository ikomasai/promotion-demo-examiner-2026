/**
 * @fileoverview Edge Functions 共有 Supabase クライアント
 * @description 全 Edge Functions で使用する Supabase クライアントのシングルトン。
 *              サービスロールキーを使用して管理者権限でアクセス。
 * @module supabase/functions/_shared/supabase
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase クライアント（サービスロール）
 * @description Edge Functions 内で使用するクライアント
 *              SUPABASE_SERVICE_ROLE_KEY で管理者権限アクセス
 * @type {SupabaseClient}
 */
export const supabaseAdmin: SupabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Supabase クライアント（匿名）
 * @description RLS ポリシーに従うクライアント
 * @type {SupabaseClient}
 */
export const supabaseAnon: SupabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

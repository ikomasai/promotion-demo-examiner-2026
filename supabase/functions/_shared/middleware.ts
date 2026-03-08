/**
 * @fileoverview Edge Function ミドルウェア
 * @description 認証チェック・CORS 処理を共通化するラッパー関数。
 * @module supabase/functions/_shared/middleware
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin, supabaseAnon } from './supabase.ts';
import { handleCors } from './cors.ts';
import { jsonResponse } from './response.ts';
import { extractToken } from './auth.ts';

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** 認証済みリクエストのコンテキスト */
export interface AuthContext {
  /** 認証済みユーザー情報 */
  user: { id: string; email?: string; [key: string]: unknown };
  /** 元のリクエスト */
  req: Request;
  /** サービスロール Supabase クライアント */
  supabaseAdmin: SupabaseClient;
}

/** withAuth オプション */
interface WithAuthOptions {
  /** supabaseAnon を使って認証する（RLS 適用）。デフォルト: false（supabaseAdmin を使用） */
  useAnon?: boolean;
}

/**
 * 認証付き Edge Function ラッパー
 * @description CORS 処理 + JWT 認証チェックを共通化する。
 *              認証成功時にハンドラーを呼び出し、失敗時は 401 を返す。
 * @param handler 認証済みコンテキストを受け取るハンドラー関数
 * @param options 認証オプション
 */
export function withAuth(
  handler: (ctx: AuthContext) => Promise<Response>,
  options: WithAuthOptions = {},
): void {
  const { useAnon = false } = options;

  serve(async (req: Request): Promise<Response> => {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return jsonResponse({ error: '認証が必要です' }, 401);
      }

      const client = useAnon ? supabaseAnon : supabaseAdmin;
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser(extractToken(authHeader));

      if (authError || !user) {
        return jsonResponse({ error: '認証に失敗しました' }, 401);
      }

      return await handler({ user: user as AuthContext['user'], req, supabaseAdmin });
    } catch (err) {
      console.error('Edge Function エラー:', err);
      return jsonResponse({ error: 'サーバーエラーが発生しました' }, 500);
    }
  });
}

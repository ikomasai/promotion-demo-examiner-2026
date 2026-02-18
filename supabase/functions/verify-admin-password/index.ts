/**
 * @fileoverview 管理者パスワード検証 Edge Function
 * @description bcrypt を使用して管理者パスワードを検証。
 *              josenai_app_settings テーブルからハッシュを取得して比較。
 * @module supabase/functions/verify-admin-password
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { supabaseAdmin, supabaseAnon } from '../_shared/supabase.ts';

/**
 * リクエストボディ型定義
 * @interface VerifyPasswordRequest
 */
interface VerifyPasswordRequest {
  /** 権限種別 (koho | kikaku | super) */
  role: 'koho' | 'kikaku' | 'super';
  /** 入力されたパスワード */
  password: string;
}

/**
 * レスポンス型定義
 * @interface VerifyPasswordResponse
 */
interface VerifyPasswordResponse {
  /** 検証結果 */
  valid: boolean;
  /** エラーメッセージ（エラー時のみ） */
  error?: string;
}

/**
 * CORS ヘッダー
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 設定キー名のマッピング
 */
const PASSWORD_KEYS: Record<string, string> = {
  koho: 'koho_admin_password_hash',
  kikaku: 'kikaku_admin_password_hash',
  super: 'super_admin_password_hash',
};

serve(async (req: Request): Promise<Response> => {
  // CORS プリフライト対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 認証チェック（ブルートフォース対策: ログイン済みユーザーのみ実行可能）
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ valid: false, error: '認証が必要です' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ valid: false, error: '認証に失敗しました' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // リクエストボディ解析
    const { role, password }: VerifyPasswordRequest = await req.json();

    // バリデーション
    if (!role || !password) {
      return new Response(
        JSON.stringify({ valid: false, error: 'role と password は必須です' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!PASSWORD_KEYS[role]) {
      return new Response(
        JSON.stringify({ valid: false, error: '無効な権限種別です' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // josenai_app_settings からパスワードハッシュを取得
    const { data: setting, error: fetchError } = await supabaseAdmin
      .from('josenai_app_settings')
      .select('value')
      .eq('key', PASSWORD_KEYS[role])
      .single();

    if (fetchError || !setting) {
      console.error('設定取得エラー:', fetchError);
      return new Response(
        JSON.stringify({ valid: false, error: 'パスワード設定が見つかりません' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // bcrypt でパスワード検証
    const storedHash = setting.value;
    const isValid = await bcrypt.compare(password, storedHash);

    const response: VerifyPasswordResponse = { valid: isValid };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('パスワード検証エラー:', err);
    return new Response(
      JSON.stringify({ valid: false, error: '検証処理中にエラーが発生しました' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

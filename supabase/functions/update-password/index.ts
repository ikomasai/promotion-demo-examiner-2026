/**
 * @fileoverview パスワード更新 Edge Function
 * @description bcrypt を使用して管理者パスワードを更新。
 *              josenai_app_settings テーブルのハッシュ値を新しいパスワードで上書き。
 * @module supabase/functions/update-password
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';

/**
 * リクエストボディ型定義
 */
interface UpdatePasswordRequest {
  /** 権限種別 (koho | kikaku | super) */
  role: 'koho' | 'kikaku' | 'super';
  /** 新しいパスワード */
  newPassword: string;
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
    // 認証チェック
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: '認証が必要です' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 管理者権限チェック
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: isAdmin } = await userClient.rpc('fn_is_josenai_admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: '管理者権限が必要です' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { role, newPassword }: UpdatePasswordRequest = await req.json();

    // バリデーション: 必須チェック
    if (!role || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'role と newPassword は必須です' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // バリデーション: role 存在チェック
    if (!PASSWORD_KEYS[role]) {
      return new Response(
        JSON.stringify({ success: false, error: '無効な権限種別です' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // バリデーション: 最低文字数
    if (newPassword.length < 4) {
      return new Response(
        JSON.stringify({ success: false, error: 'パスワードは4文字以上で入力してください' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // bcrypt でハッシュ生成
    const hash = bcrypt.hashSync(newPassword);

    // josenai_app_settings を更新
    const { error: updateError } = await supabaseAdmin
      .from('josenai_app_settings')
      .update({ value: hash })
      .eq('key', PASSWORD_KEYS[role]);

    if (updateError) {
      console.error('パスワード更新エラー:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'パスワードの更新に失敗しました' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('パスワード更新エラー:', err);
    return new Response(
      JSON.stringify({ success: false, error: '処理中にエラーが発生しました' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

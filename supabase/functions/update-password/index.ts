/**
 * @fileoverview パスワード更新 Edge Function
 * @description bcrypt を使用して管理者パスワードを更新。
 *              josenai_app_settings テーブルのハッシュ値を新しいパスワードで上書き。
 * @module supabase/functions/update-password
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { handleCors } from '../_shared/cors.ts';
import { jsonResponse } from '../_shared/response.ts';
import { createUserClient, PASSWORD_KEYS } from '../_shared/auth.ts';

/**
 * リクエストボディ型定義
 */
interface UpdatePasswordRequest {
  /** 権限種別 (koho | kikaku | super) */
  role: 'koho' | 'kikaku' | 'super';
  /** 新しいパスワード */
  newPassword: string;
}

serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 認証チェック
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ success: false, error: '認証が必要です' }, 401);
    }

    // 管理者権限チェック
    const userClient = createUserClient(authHeader);
    const { data: isAdmin } = await userClient.rpc('fn_is_josenai_admin');
    if (!isAdmin) {
      return jsonResponse({ success: false, error: '管理者権限が必要です' }, 403);
    }

    const { role, newPassword }: UpdatePasswordRequest = await req.json();

    // バリデーション: 必須チェック
    if (!role || !newPassword) {
      return jsonResponse({ success: false, error: 'role と newPassword は必須です' }, 400);
    }

    // バリデーション: role 存在チェック
    if (!PASSWORD_KEYS[role]) {
      return jsonResponse({ success: false, error: '無効な権限種別です' }, 400);
    }

    // バリデーション: 最低文字数
    if (newPassword.length < 8) {
      return jsonResponse({ success: false, error: 'パスワードは8文字以上で入力してください' }, 400);
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
      return jsonResponse({ success: false, error: 'パスワードの更新に失敗しました' }, 500);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('パスワード更新エラー:', err);
    return jsonResponse({ success: false, error: '処理中にエラーが発生しました' }, 500);
  }
});

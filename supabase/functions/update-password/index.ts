/**
 * @fileoverview パスワード更新 Edge Function
 * @description bcrypt を使用して管理者パスワードを更新。
 *              josenai_app_settings テーブルのハッシュ値を新しいパスワードで上書き。
 * @module supabase/functions/update-password
 */

import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { withAuth } from '../_shared/middleware.ts';
import { jsonResponse } from '../_shared/response.ts';
import { createUserClient, PASSWORD_KEYS } from '../_shared/auth.ts';
import { MIN_PASSWORD_LENGTH } from '../_shared/adminConfig.ts';

/** リクエストボディ型定義 */
interface UpdatePasswordRequest {
  role: 'koho' | 'kikaku' | 'super';
  newPassword: string;
}

withAuth(async ({ req, supabaseAdmin }) => {
  // 管理者権限チェック
  const authHeader = req.headers.get('Authorization')!;
  const userClient = createUserClient(authHeader);
  const { data: isAdmin } = await userClient.rpc('fn_is_josenai_admin');
  if (!isAdmin) {
    return jsonResponse({ success: false, error: '管理者権限が必要です' }, 403);
  }

  const { role, newPassword }: UpdatePasswordRequest = await req.json();

  if (!role || !newPassword) {
    return jsonResponse({ success: false, error: 'role と newPassword は必須です' }, 400);
  }

  if (!PASSWORD_KEYS[role]) {
    return jsonResponse({ success: false, error: '無効な権限種別です' }, 400);
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return jsonResponse(
      { success: false, error: `パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください` },
      400,
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
    return jsonResponse({ success: false, error: 'パスワードの更新に失敗しました' }, 500);
  }

  return jsonResponse({ success: true });
});

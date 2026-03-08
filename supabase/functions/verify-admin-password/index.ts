/**
 * @fileoverview 管理者パスワード検証 Edge Function
 * @description bcrypt を使用して管理者パスワードを検証。
 *              josenai_app_settings テーブルからハッシュを取得して比較。
 * @module supabase/functions/verify-admin-password
 */

import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { withAuth } from '../_shared/middleware.ts';
import { jsonResponse } from '../_shared/response.ts';
import { PASSWORD_KEYS } from '../_shared/auth.ts';

/** リクエストボディ型定義 */
interface VerifyPasswordRequest {
  role: 'koho' | 'kikaku' | 'super';
  password: string;
}

withAuth(async ({ req, supabaseAdmin }) => {
  const { role, password }: VerifyPasswordRequest = await req.json();

  if (!role || !password) {
    return jsonResponse({ valid: false, error: 'role と password は必須です' }, 400);
  }

  if (!PASSWORD_KEYS[role]) {
    return jsonResponse({ valid: false, error: '無効な権限種別です' }, 400);
  }

  // josenai_app_settings からパスワードハッシュを取得
  const { data: setting, error: fetchError } = await supabaseAdmin
    .from('josenai_app_settings')
    .select('value')
    .eq('key', PASSWORD_KEYS[role])
    .single();

  if (fetchError || !setting) {
    console.error('設定取得エラー:', fetchError);
    return jsonResponse({ valid: false, error: 'パスワード設定が見つかりません' }, 500);
  }

  // bcrypt でパスワード検証（compareSync: Deno Deploy は Worker 非対応のため）
  const isValid = bcrypt.compareSync(password, setting.value);

  return jsonResponse({ valid: isValid });
}, { useAnon: true });

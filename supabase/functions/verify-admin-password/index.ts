/**
 * @fileoverview 管理者パスワード検証 Edge Function
 * @description bcrypt を使用して管理者パスワードを検証。
 *              josenai_app_settings テーブルからハッシュを取得して比較。
 * @module supabase/functions/verify-admin-password
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { supabaseAdmin, supabaseAnon } from '../_shared/supabase.ts';
import { handleCors } from '../_shared/cors.ts';
import { jsonResponse } from '../_shared/response.ts';
import { extractToken, PASSWORD_KEYS } from '../_shared/auth.ts';

/**
 * リクエストボディ型定義
 */
interface VerifyPasswordRequest {
  /** 権限種別 (koho | kikaku | super) */
  role: 'koho' | 'kikaku' | 'super';
  /** 入力されたパスワード */
  password: string;
}

serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 認証チェック（ブルートフォース対策: ログイン済みユーザーのみ実行可能）
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ valid: false, error: '認証が必要です' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(
      extractToken(authHeader),
    );

    if (authError || !user) {
      return jsonResponse({ valid: false, error: '認証に失敗しました' }, 401);
    }

    // リクエストボディ解析
    const { role, password }: VerifyPasswordRequest = await req.json();

    // バリデーション
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
    const storedHash = setting.value;
    const isValid = bcrypt.compareSync(password, storedHash);

    return jsonResponse({ valid: isValid });
  } catch (err) {
    console.error('パスワード検証エラー:', err);
    return jsonResponse({ valid: false, error: '検証処理中にエラーが発生しました' }, 500);
  }
});

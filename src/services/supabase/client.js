/**
 * @fileoverview Supabase クライアント シングルトン
 * @description アプリケーション全体で使用する Supabase クライアントインスタンス。
 *              認証、データベース操作、Edge Functions 呼び出しに使用。
 * @module services/supabase/client
 * @requires @supabase/supabase-js
 *
 * @example
 * // データ取得
 * import { supabase } from '@/services/supabase/client';
 * const { data, error } = await supabase.from('josenai_organizations').select('*');
 *
 * @example
 * // 認証
 * await supabase.auth.signInWithPassword({ email, password });
 *
 * @example
 * // Edge Function 呼び出し
 * const { data, error } = await supabase.functions.invoke('sandbox', { body: { file } });
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase プロジェクト URL
 * @constant {string}
 * @description 環境変数から取得。EXPO_PUBLIC_ プレフィックスでクライアントに公開。
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

/**
 * Supabase 匿名キー（Anon Key）
 * @constant {string}
 * @description RLS（Row Level Security）ポリシーで保護されたデータにアクセス可能。
 *              クライアントに公開されても安全（RLS が認可を制御）。
 */
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase クライアント インスタンス（シングルトン）
 *
 * @description 以下の機能を提供:
 * - auth: Email/Password 認証、セッション管理
 * - from(): データベーステーブルへのCRUD操作
 * - functions.invoke(): Edge Functions の呼び出し
 * - storage: ファイルストレージ（本システムでは Google Drive を使用するため未使用）
 *
 * @type {import('@supabase/supabase-js').SupabaseClient}
 *
 * @example
 * // プロフィール取得（RLS により自分のデータのみ取得可能）
 * // user_profiles: 共有ユーザー情報（名前・所属）
 * // josenai_profiles: 情宣固有データ（事前チェック使用回数）
 * const { data: profile } = await supabase
 *   .from('josenai_profiles')
 *   .select('*')
 *   .single();
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    /**
     * セッション自動リフレッシュを有効化
     * @description アクセストークンの有効期限前に自動的にリフレッシュ
     */
    autoRefreshToken: true,

    /**
     * セッションを localStorage に永続化
     * @description ブラウザを閉じても認証状態を維持
     */
    persistSession: true,

    /**
     * URL フラグメントからセッションを検出
     * @description パスワードリセット等のリンクからのセッション復元に使用
     */
    detectSessionInUrl: true,
  },
});

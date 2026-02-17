/**
 * @fileoverview 認証コンテキスト - Google OAuth 認証状態管理
 * @description Supabase Auth を使用した Google OAuth 認証を管理。
 *              @kindai.ac.jp ドメイン制限。
 *              初回ログイン時に user_profiles（共有）と josenai_profiles（情宣固有）を upsert。
 * @module shared/contexts/AuthContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase/client';

/** @constant {string} 許可されるメールドメイン */
const ALLOWED_DOMAIN = '@kindai.ac.jp';

/**
 * @typedef {Object} Profile
 * @property {string} id - auth.users の user ID
 * @property {string} email - メールアドレス（auth.users から取得）
 * @property {string|null} displayName - 表示名（user_profiles.name）
 * @property {number} sandboxCountToday - 本日のサンドボックス使用回数
 * @property {string|null} sandboxCountDate - サンドボックスカウント日付
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {Object|null} user - Supabase Auth ユーザー
 * @property {Profile|null} profile - 統合プロフィールデータ
 * @property {boolean} loading - 読み込み中フラグ
 * @property {string|null} error - エラーメッセージ
 * @property {Function} signIn - ログイン開始
 * @property {Function} signOut - ログアウト
 * @property {Function} refreshProfile - プロフィール再取得
 */

const AuthContext = createContext(null);

/**
 * 認証プロバイダー
 * @description Google OAuth 認証を管理し、ログイン時に共有・情宣固有プロフィールを upsert する。
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * プロフィール取得または作成
   * @description user_profiles（共有）と josenai_profiles（情宣固有）に upsert し、
   *              統合プロフィールオブジェクトを返す。
   * @param {Object} authUser - Supabase Auth ユーザーオブジェクト
   * @returns {Promise<Profile|null>} 統合プロフィール
   */
  const fetchOrCreateProfile = useCallback(async (authUser) => {
    try {
      const displayName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '';

      // 1. user_profiles（共有テーブル）に upsert
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: authUser.id,
            name: displayName,
          },
          { onConflict: 'user_id' }
        );

      if (userProfileError) {
        console.error('user_profiles upsert エラー:', userProfileError);
      }

      // 2. josenai_profiles（情宣固有テーブル）に upsert
      const { data: josenaiProfile, error: josenaiError } = await supabase
        .from('josenai_profiles')
        .upsert(
          {
            user_id: authUser.id,
            sandbox_count_today: 0,
          },
          { onConflict: 'user_id', ignoreDuplicates: true }
        )
        .select('sandbox_count_today, sandbox_count_date')
        .single();

      if (josenaiError) {
        console.error('josenai_profiles upsert エラー:', josenaiError);
      }

      // 3. 統合プロフィールを構築
      return {
        id: authUser.id,
        email: authUser.email,
        displayName,
        sandboxCountToday: josenaiProfile?.sandbox_count_today ?? 0,
        sandboxCountDate: josenaiProfile?.sandbox_count_date ?? null,
      };
    } catch (err) {
      console.error('プロフィール取得/作成例外:', err);
      return null;
    }
  }, []);

  /**
   * プロフィール再取得
   * @description サンドボックス使用後など、最新データが必要な場合に呼び出す。
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const freshProfile = await fetchOrCreateProfile(user);
    setProfile(freshProfile);
  }, [user, fetchOrCreateProfile]);

  /**
   * ドメイン検証
   * @param {string} email
   * @returns {boolean}
   */
  const isAllowedDomain = (email) => email?.endsWith(ALLOWED_DOMAIN);

  /**
   * Google OAuth ログイン
   * @description @kindai.ac.jp ドメインのみ許可
   */
  const signIn = useCallback(async () => {
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { hd: 'kindai.ac.jp' },
        },
      });

      if (authError) {
        setError('ログインに失敗しました。');
        console.error('OAuth エラー:', authError);
      }
    } catch (err) {
      setError('ログイン処理中にエラーが発生しました。');
      console.error('signIn 例外:', err);
    }
  }, []);

  /**
   * ログアウト
   */
  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError('ログアウトに失敗しました。');
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      setError('ログアウト処理中にエラーが発生しました。');
    }
  }, []);

  /**
   * 認証状態の初期化と監視
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          if (!isAllowedDomain(session.user.email)) {
            await supabase.auth.signOut();
            if (mounted) {
              setError('@kindai.ac.jp のメールアドレスでログインしてください。');
              setLoading(false);
            }
            return;
          }

          if (mounted) {
            setUser(session.user);
            const userProfile = await fetchOrCreateProfile(session.user);
            setProfile(userProfile);
          }
        }
      } catch (err) {
        console.error('認証初期化エラー:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          if (!isAllowedDomain(session.user.email)) {
            setError('@kindai.ac.jp のメールアドレスでログインしてください。');
            await supabase.auth.signOut();
            return;
          }
          setUser(session.user);
          setError(null);
          const userProfile = await fetchOrCreateProfile(session.user);
          setProfile(userProfile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchOrCreateProfile]);

  const value = { user, profile, loading, error, signIn, signOut, refreshProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 認証コンテキストフック
 * @returns {AuthContextValue}
 * @throws {Error} AuthProvider 外で使用した場合
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth は AuthProvider 内で使用してください');
  }
  return context;
}

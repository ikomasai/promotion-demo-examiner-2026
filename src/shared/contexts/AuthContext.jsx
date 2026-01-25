/**
 * @fileoverview 認証コンテキスト - Google OAuth 認証状態管理
 * @description Supabase Auth を使用した Google OAuth 認証を管理。
 *              @kindai.ac.jp ドメイン制限、プロフィール自動取得を提供。
 * @module shared/contexts/AuthContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase/client';

/** @constant {string} 許可されるメールドメイン */
const ALLOWED_DOMAIN = '@kindai.ac.jp';

/**
 * @typedef {Object} AuthContextValue
 * @property {Object|null} user - Supabase Auth ユーザー
 * @property {Object|null} profile - profiles テーブルのデータ
 * @property {boolean} loading - 読み込み中フラグ
 * @property {string|null} error - エラーメッセージ
 * @property {Function} signIn - ログイン開始
 * @property {Function} signOut - ログアウト
 * @property {Function} refreshProfile - プロフィール再取得
 */

const AuthContext = createContext(null);

/**
 * 認証プロバイダー
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * プロフィール取得
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('プロフィール取得エラー:', fetchError);
        return null;
      }
      return data;
    } catch (err) {
      console.error('プロフィール取得例外:', err);
      return null;
    }
  }, []);

  /**
   * プロフィール再取得（管理者権限変更後などに使用）
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const freshProfile = await fetchProfile(user.id);
    setProfile(freshProfile);
  }, [user, fetchProfile]);

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
            const userProfile = await fetchProfile(session.user.id);
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
          const userProfile = await fetchProfile(session.user.id);
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
  }, [fetchProfile]);

  const value = { user, profile, loading, error, signIn, signOut, refreshProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 認証コンテキストフック
 * @returns {AuthContextValue}
 * @throws {Error} AuthProvider外で使用した場合
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth は AuthProvider 内で使用してください');
  }
  return context;
}

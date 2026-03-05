/**
 * @fileoverview 認証コンテキスト - Email/Password 認証状態管理
 * @description Supabase Auth を使用した Email/Password 認証を管理。
 *              @kindai.ac.jp ドメイン制限。
 *              初回ログイン時に user_profiles（共有）と josenai_profiles（情宣固有）を upsert。
 * @module shared/contexts/AuthContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase/client';
import { isAllowedDomain } from '../utils/validateEmail';

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
 * @property {Function} signIn - Email/Password ログイン
 * @property {Function} signOut - ログアウト
 * @property {Function} refreshProfile - プロフィール再取得
 */

const AuthContext = createContext(null);

/**
 * 認証プロバイダー
 * @description Email/Password 認証を管理し、ログイン時に共有・情宣固有プロフィールを upsert する。
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
      const displayName = authUser.email?.split('@')[0] || '';

      // 1. user_profiles（共有テーブル）に upsert
      const { error: userProfileError } = await supabase.from('user_profiles').upsert(
        {
          user_id: authUser.id,
          name: displayName,
        },
        { onConflict: 'user_id' },
      );

      if (userProfileError) {
        console.error('user_profiles upsert エラー:', userProfileError);
      }

      // 2. josenai_profiles（情宣固有テーブル）に初回のみ行作成
      //    ignoreDuplicates: true → 既存行がある場合はスキップ（既存データを上書きしない）
      //    初回ログイン時のみ sandbox_count_today=0 で行を作成する意図
      await supabase.from('josenai_profiles').upsert(
        {
          user_id: authUser.id,
          sandbox_count_today: 0,
        },
        { onConflict: 'user_id', ignoreDuplicates: true },
      );

      // 3. 最新データを select で取得
      const { data: josenaiProfile, error: josenaiError } = await supabase
        .from('josenai_profiles')
        .select('sandbox_count_today, sandbox_count_date')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (josenaiError) {
        console.error('josenai_profiles 取得エラー:', josenaiError);
      }

      // 4. 統合プロフィールを構築
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
   * Email/Password ログイン
   * @param {string} email
   * @param {string} password
   */
  const signIn = useCallback(async (email, password) => {
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('メールアドレスまたはパスワードが正しくありません。');
        console.error('signIn エラー:', authError);
        return 'error';
      }
      return 'ok';
    } catch (err) {
      setError('ログイン処理中にエラーが発生しました。');
      console.error('signIn 例外:', err);
      return 'error';
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
   * @description onAuthStateChange 内では React state の更新のみ行い、
   *              DB操作（profile upsert）は別の useEffect に分離する。
   *              Supabase v2 の navigator.locks と onAuthStateChange コールバック内の
   *              DB操作が競合しデッドロックするのを防ぐ。
   */
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') &&
        session?.user
      ) {
        if (!isAllowedDomain(session.user.email)) {
          setError('@kindai.ac.jp のメールアドレスでログインしてください。');
          supabase.auth.signOut();
          return;
        }
        setUser(session.user);
        setError(null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * user 変更時にプロフィールを取得・作成
   * @description onAuthStateChange とは別の useEffect で DB 操作を行い、
   *              Supabase auth ロックとの競合を回避する。
   */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    fetchOrCreateProfile(user).then((p) => {
      if (!cancelled) setProfile(p);
    });

    return () => {
      cancelled = true;
    };
  }, [user, fetchOrCreateProfile]);

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

/**
 * @fileoverview 管理者コンテキスト - 管理者権限状態管理
 * @description 管理者パスワード認証と権限（koho/kikaku/super）の管理。
 *              Edge Function を通じた bcrypt 検証を使用。
 * @module shared/contexts/AdminContext
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from './AuthContext';

/**
 * @typedef {'koho'|'kikaku'|'super'} AdminRole
 * @description 管理者権限種別
 * - koho: 広報部管理者（SNS提出のみ審査可能）
 * - kikaku: 企画管理部管理者（企画物のみ審査可能）
 * - super: スーパー管理者（全機能アクセス可能）
 */

/**
 * @typedef {Object} AdminContextValue
 * @property {AdminRole|null} adminRole - 現在の管理者権限
 * @property {boolean} isAdmin - 管理者かどうか
 * @property {boolean} verifying - 認証処理中フラグ
 * @property {string|null} error - エラーメッセージ
 * @property {Function} verifyPassword - パスワード検証
 * @property {Function} clearAdminRole - 管理者権限クリア
 */

const AdminContext = createContext(null);

/**
 * 管理者プロバイダー
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AdminProvider({ children }) {
  const { profile, refreshProfile } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 現在の管理者権限（profileから取得）
   * @type {AdminRole|null}
   */
  const adminRole = profile?.admin_role || null;

  /**
   * 管理者かどうか
   * @type {boolean}
   */
  const isAdmin = adminRole !== null;

  /**
   * パスワード検証
   * @description Edge Function を呼び出して bcrypt 検証を実行
   * @param {AdminRole} role - 検証する権限種別
   * @param {string} password - 入力されたパスワード
   * @returns {Promise<boolean>} 検証成功かどうか
   */
  const verifyPassword = useCallback(async (role, password) => {
    setError(null);
    setVerifying(true);

    try {
      // Edge Function で bcrypt 検証
      const { data, error: funcError } = await supabase.functions.invoke(
        'verify-admin-password',
        {
          body: { role, password },
        }
      );

      if (funcError) {
        setError('認証処理中にエラーが発生しました。');
        console.error('Edge Function エラー:', funcError);
        return false;
      }

      if (!data?.valid) {
        setError('パスワードが正しくありません。');
        return false;
      }

      // 認証成功: profiles.admin_role を更新
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ admin_role: role })
        .eq('id', profile.id);

      if (updateError) {
        setError('権限の更新に失敗しました。');
        console.error('Profile 更新エラー:', updateError);
        return false;
      }

      // プロフィールを再取得して状態を更新
      await refreshProfile();
      return true;
    } catch (err) {
      setError('認証処理中にエラーが発生しました。');
      console.error('verifyPassword 例外:', err);
      return false;
    } finally {
      setVerifying(false);
    }
  }, [profile, refreshProfile]);

  /**
   * 管理者権限クリア（一般ユーザーに戻る）
   * @description ログアウトせずに管理者権限のみ解除
   */
  const clearAdminRole = useCallback(async () => {
    if (!profile) return;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ admin_role: null })
        .eq('id', profile.id);

      if (updateError) {
        console.error('権限クリアエラー:', updateError);
        return;
      }

      await refreshProfile();
    } catch (err) {
      console.error('clearAdminRole 例外:', err);
    }
  }, [profile, refreshProfile]);

  const value = {
    adminRole,
    isAdmin,
    verifying,
    error,
    verifyPassword,
    clearAdminRole,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

/**
 * 管理者コンテキストフック
 * @returns {AdminContextValue}
 * @throws {Error} AdminProvider外で使用した場合
 */
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin は AdminProvider 内で使用してください');
  }
  return context;
}

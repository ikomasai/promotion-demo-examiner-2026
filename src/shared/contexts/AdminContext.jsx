/**
 * @fileoverview 管理者コンテキスト - セッションベースの管理者権限管理
 * @description 管理者パスワード認証と画面アクセス権限の管理。
 *              Edge Function を通じた bcrypt 検証を使用し、
 *              認証成功時は sessionStorage + React state に screen 権限を保持する。
 *              DB への書き込みは行わない（共有 RBAC は RLS 側で制御）。
 * @module shared/contexts/AdminContext
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../../services/supabase/client';
import { SCREENS, ROLE_TO_SCREENS } from '../constants/adminConfig';

const STORAGE_KEY = 'josenai_admin_screens';

/**
 * sessionStorage から保存済みの screen 権限を復元する
 * @returns {Set<string>} 復元された screen セット
 */
function restoreScreens() {
  if (Platform.OS !== 'web') return new Set();
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {
    // sessionStorage 読み取り失敗時は空セット
  }
  return new Set();
}

/**
 * screen 権限を sessionStorage に保存する
 * @param {Set<string>} screens
 */
function persistScreens(screens) {
  if (Platform.OS !== 'web') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...screens]));
  } catch {
    // sessionStorage 書き込み失敗は無視
  }
}

const AdminContext = createContext(null);

/**
 * 管理者プロバイダー
 * @description パスワード認証成功時に sessionStorage + React state で screen 権限を管理する。
 *              DB への書き込みは行わず、ブラウザセッション中のみ有効。
 *              タブを閉じるまで権限が保持される（リロードでも維持）。
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AdminProvider({ children }) {
  const [screens, setScreens] = useState(() => restoreScreens());
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [modalDismissed, setModalDismissed] = useState(() => restoreScreens().size > 0);

  // screens が変更されたら sessionStorage に永続化
  useEffect(() => {
    persistScreens(screens);
  }, [screens]);

  /**
   * 指定 screen へのアクセス権があるか判定
   */
  const hasScreen = useCallback(
    (screenName) => {
      return screens.has(screenName);
    },
    [screens],
  );

  const isKohoReviewer = useMemo(() => screens.has(SCREENS.REVIEW_KOHO), [screens]);
  const isKikakuReviewer = useMemo(() => screens.has(SCREENS.REVIEW_KIKAKU), [screens]);
  const isAdmin = useMemo(() => screens.has(SCREENS.ADMIN), [screens]);
  const isReviewer = useMemo(
    () => isKohoReviewer || isKikakuReviewer || isAdmin,
    [isKohoReviewer, isKikakuReviewer, isAdmin],
  );

  /**
   * パスワード検証
   */
  const verifyPassword = useCallback(async (role, password) => {
    setError(null);
    setVerifying(true);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('verify-admin-password', {
        body: { role, password },
      });

      if (funcError) {
        setError('認証処理中にエラーが発生しました。');
        console.error('Edge Function エラー:', funcError);
        return false;
      }

      if (!data?.valid) {
        setError('パスワードが正しくありません。');
        return false;
      }

      // 認証成功: 対応する screen 権限を state に追加
      const newScreens = ROLE_TO_SCREENS[role];
      if (newScreens) {
        setScreens((prev) => {
          const updated = new Set(prev);
          newScreens.forEach((s) => updated.add(s));
          return updated;
        });
      }

      return true;
    } catch (err) {
      setError('認証処理中にエラーが発生しました。');
      console.error('verifyPassword 例外:', err);
      return false;
    } finally {
      setVerifying(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const dismissModal = useCallback(() => {
    setModalDismissed(true);
  }, []);

  const showModal = useCallback(() => {
    setModalDismissed(false);
  }, []);

  /**
   * 全 screen 権限をクリア（一般ユーザーに戻る）
   */
  const clearScreens = useCallback(() => {
    setScreens(new Set());
    setError(null);
    setModalDismissed(false);
    if (Platform.OS === 'web') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const value = {
    screens,
    hasScreen,
    isKohoReviewer,
    isKikakuReviewer,
    isAdmin,
    isReviewer,
    modalDismissed,
    dismissModal,
    showModal,
    verifying,
    error,
    clearError,
    verifyPassword,
    clearScreens,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

/**
 * 管理者コンテキストフック
 * @returns {AdminContextValue}
 * @throws {Error} AdminProvider 外で使用した場合
 */
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin は AdminProvider 内で使用してください');
  }
  return context;
}

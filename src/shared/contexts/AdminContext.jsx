/**
 * @fileoverview 管理者コンテキスト - セッションベースの管理者権限管理
 * @description 管理者パスワード認証と画面アクセス権限の管理。
 *              Edge Function を通じた bcrypt 検証を使用し、
 *              認証成功時はクライアント側の React state に screen 権限を保持する。
 *              DB への書き込みは行わない（共有 RBAC は RLS 側で制御）。
 * @module shared/contexts/AdminContext
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase/client';

/**
 * @typedef {'koho'|'kikaku'|'super'} RoleType
 * @description パスワード認証時に選択する権限種別
 * - koho: 広報部（koho 提出の審査が可能）
 * - kikaku: 企画管理部（kikaku 提出の審査が可能）
 * - super: 管理者（全機能アクセス可能）
 */

/**
 * screen 識別子の定数
 * @description 共有 RBAC の screen 名と一致させる
 */
const SCREENS = {
  REVIEW_KOHO: 'josenai_review_koho',
  REVIEW_KIKAKU: 'josenai_review_kikaku',
  ADMIN: 'josenai_admin',
};

/**
 * RoleType → 付与する screen のマッピング
 * @type {Record<RoleType, string[]>}
 */
const ROLE_TO_SCREENS = {
  koho: [SCREENS.REVIEW_KOHO],
  kikaku: [SCREENS.REVIEW_KIKAKU],
  super: [SCREENS.REVIEW_KOHO, SCREENS.REVIEW_KIKAKU, SCREENS.ADMIN],
};

/**
 * @typedef {Object} AdminContextValue
 * @property {Set<string>} screens - 現在のセッションで有効な screen 権限セット
 * @property {boolean} isKohoReviewer - 広報部審査権限があるか
 * @property {boolean} isKikakuReviewer - 企画管理部審査権限があるか
 * @property {boolean} isAdmin - 管理者権限があるか
 * @property {boolean} isReviewer - いずれかの審査権限があるか
 * @property {Function} hasScreen - 指定 screen へのアクセス権があるか判定
 * @property {boolean} verifying - 認証処理中フラグ
 * @property {string|null} error - エラーメッセージ
 * @property {Function} verifyPassword - パスワード検証
 * @property {Function} clearScreens - 全 screen 権限をクリア（一般ユーザーに戻る）
 */

const AdminContext = createContext(null);

/**
 * 管理者プロバイダー
 * @description パスワード認証成功時に React state で screen 権限を管理する。
 *              DB への書き込みは行わず、ブラウザセッション中のみ有効。
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AdminProvider({ children }) {
  const [screens, setScreens] = useState(new Set());
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [modalDismissed, setModalDismissed] = useState(false);

  /**
   * 指定 screen へのアクセス権があるか判定
   * @param {string} screenName - screen 識別子
   * @returns {boolean}
   */
  const hasScreen = useCallback(
    (screenName) => {
      return screens.has(screenName);
    },
    [screens],
  );

  /**
   * 便利プロパティ: 各権限の判定
   */
  const isKohoReviewer = useMemo(() => screens.has(SCREENS.REVIEW_KOHO), [screens]);
  const isKikakuReviewer = useMemo(() => screens.has(SCREENS.REVIEW_KIKAKU), [screens]);
  const isAdmin = useMemo(() => screens.has(SCREENS.ADMIN), [screens]);
  const isReviewer = useMemo(
    () => isKohoReviewer || isKikakuReviewer || isAdmin,
    [isKohoReviewer, isKikakuReviewer, isAdmin],
  );

  /**
   * パスワード検証
   * @description Edge Function を呼び出して bcrypt 検証を実行。
   *              成功時は対応する screen 権限を React state に追加する。
   * @param {RoleType} role - 検証する権限種別
   * @param {string} password - 入力されたパスワード
   * @returns {Promise<boolean>} 検証成功かどうか
   */
  const verifyPassword = useCallback(async (role, password) => {
    setError(null);
    setVerifying(true);

    try {
      // Edge Function で bcrypt 検証
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

  /**
   * エラーメッセージをクリア
   * @description 再試行時に前回のエラーを消すために使用。
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 管理者認証モーダルを閉じたことを記録
   */
  const dismissModal = useCallback(() => {
    setModalDismissed(true);
  }, []);

  /**
   * 管理者認証モーダルを再表示（ドロワーからの再入用）
   */
  const showModal = useCallback(() => {
    setModalDismissed(false);
  }, []);

  /**
   * 全 screen 権限をクリア（一般ユーザーに戻る）
   * @description ログアウトせずに管理者権限のみ解除する。
   *              DB への書き込みは不要（セッション state のみ）。
   */
  const clearScreens = useCallback(() => {
    setScreens(new Set());
    setError(null);
    setModalDismissed(false);
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

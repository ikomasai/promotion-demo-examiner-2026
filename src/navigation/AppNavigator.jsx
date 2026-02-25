/**
 * @fileoverview アプリナビゲーター - 認証状態ルーティング
 * @description 認証状態に応じて LoginScreen / DrawerNavigator を切り替え。
 *              未認証時はログイン画面、認証済みならドロワーナビゲーションを表示。
 * @module navigation/AppNavigator
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../shared/contexts/AuthContext';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import LoginScreen from '../features/auth/screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import AdminPasswordModal from '../features/auth/components/AdminPasswordModal';

/**
 * アプリナビゲーター
 * @description 認証状態に基づくルーティングのルートコンポーネント
 *              - loading: ローディングスピナー表示
 *              - 未認証: LoginScreen 表示
 *              - 認証済: AdminPasswordModal (overlay) + DrawerNavigator 表示
 * @returns {React.ReactElement}
 */
export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [adminModalDismissed, setAdminModalDismissed] = useState(false);

  // ログアウト時にリセット（次回ログイン時に再表示）
  useEffect(() => {
    if (!user) setAdminModalDismissed(false);
  }, [user]);

  // 認証状態確認中
  if (loading) {
    return <LoadingSpinner message="認証状態を確認中..." />;
  }

  // 未認証: ログイン画面
  if (!user) {
    return <LoginScreen />;
  }

  // 認証済: ドロワーナビゲーション + 管理者認証モーダル
  return (
    <>
      <NavigationContainer>
        <DrawerNavigator />
      </NavigationContainer>
      <AdminPasswordModal
        visible={!adminModalDismissed}
        onClose={() => setAdminModalDismissed(true)}
        onSuccess={() => setAdminModalDismissed(true)}
      />
    </>
  );
}

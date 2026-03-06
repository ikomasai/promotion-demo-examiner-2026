/**
 * @fileoverview アプリナビゲーター - 認証状態ルーティング
 * @description 認証状態に応じて LoginScreen / DrawerNavigator を切り替え。
 *              未認証時はログイン画面、認証済みならドロワーナビゲーションを表示。
 * @module navigation/AppNavigator
 */

import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useAuth } from '../shared/contexts/AuthContext';
import { useAdmin } from '../shared/contexts/AdminContext';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import LoginScreen from '../features/auth/screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import AdminPasswordModal from '../features/auth/components/AdminPasswordModal';

/** アプリ全体のダークテーマ（React Navigation 用） */
const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#1a1a2e',
    card: '#1a1a2e',
    text: '#ffffff',
    border: '#2d2d44',
    primary: '#4dabf7',
  },
};

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
  const { modalDismissed, dismissModal } = useAdmin();

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
      <NavigationContainer theme={AppTheme}>
        <DrawerNavigator />
      </NavigationContainer>
      <AdminPasswordModal
        visible={!modalDismissed}
        onClose={dismissModal}
        onSuccess={dismissModal}
      />
    </>
  );
}

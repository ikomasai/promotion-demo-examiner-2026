/**
 * @fileoverview 生駒祭 情宣AI判定システム - ルートコンポーネント
 * @description アプリケーション全体のプロバイダー階層を定義し、
 *              認証状態・管理者権限・通知機能をアプリ全体で利用可能にする。
 * @module App
 * @requires react-native-gesture-handler - スワイプジェスチャー（Drawer用）
 * @requires AuthProvider - メール/パスワード認証状態管理
 * @requires AdminProvider - 管理者権限（koho/kikaku/super）管理
 * @requires ToastProvider - アプリ内通知表示
 * @requires AppNavigator - 認証状態に基づくルーティング
 */

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/shared/contexts/AuthContext';
import { AdminProvider } from './src/shared/contexts/AdminContext';
import { ToastProvider } from './src/shared/contexts/ToastContext';
import ScreenErrorBoundary from './src/shared/components/ScreenErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * アプリケーションのルートコンポーネント
 *
 * @description Provider階層の構成:
 * 1. GestureHandlerRootView - Drawerのスワイプジェスチャーを有効化
 * 2. ScreenErrorBoundary - アプリ全体のエラーをキャッチ
 * 3. AuthProvider - Supabase Auth による認証状態を管理
 * 4. AdminProvider - 管理者パスワード認証後の権限を管理
 * 5. ToastProvider - 成功/エラー通知をアプリ全体で表示
 * 6. AppNavigator - 認証状態に応じてLogin/Main画面を切り替え
 *
 * @returns {React.ReactElement} プロバイダーでラップされたアプリケーション
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenErrorBoundary>
        <AuthProvider>
          <AdminProvider>
            <ToastProvider>
              <AppNavigator />
            </ToastProvider>
          </AdminProvider>
        </AuthProvider>
      </ScreenErrorBoundary>
    </GestureHandlerRootView>
  );
}

/**
 * @fileoverview ドロワーナビゲーター - サイドバー付きナビゲーション
 * @description 7画面を管理するドロワーナビゲーション。
 *              管理者権限に応じてメニュー項目の表示/非表示を制御。
 * @module navigation/DrawerNavigator
 */

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAdmin } from '../shared/contexts/AdminContext';
import CustomDrawerContent from './components/CustomDrawerContent';
import ScreenErrorBoundary from '../shared/components/ScreenErrorBoundary';

// 画面コンポーネント（後続タスクで実装予定のプレースホルダー）
import SandboxScreen from '../features/submission/screens/SandboxScreen';
import SubmitScreen from '../features/submission/screens/SubmitScreen';
import HistoryScreen from '../features/submission/screens/HistoryScreen';
import DashboardScreen from '../features/review/screens/DashboardScreen';
import RuleListScreen from '../features/rules/screens/RuleListScreen';
import MasterScreen from '../features/master/screens/MasterScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';

const Drawer = createDrawerNavigator();

/**
 * 画面をエラーバウンダリでラップ
 * @param {React.ComponentType} Component - ラップする画面コンポーネント
 * @returns {React.FC} ラップされたコンポーネント
 */
function withErrorBoundary(Component) {
  return function WrappedScreen(props) {
    return (
      <ScreenErrorBoundary>
        <Component {...props} />
      </ScreenErrorBoundary>
    );
  };
}

/**
 * ドロワーナビゲーター
 * @description 認証済みユーザー向けのメインナビゲーション
 *              - 一般ユーザー: サンドボックス, 提出, 履歴
 *              - koho/kikaku: + ダッシュボード, ルール, 設定
 *              - super: + マスタ管理
 * @returns {React.ReactElement}
 */
export default function DrawerNavigator() {
  const { adminRole, isAdmin } = useAdmin();

  /**
   * マスタ管理画面の表示権限（superのみ）
   * @type {boolean}
   */
  const canAccessMaster = adminRole === 'super';

  return (
    <Drawer.Navigator
      initialRouteName="サンドボックス"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerStyle: {
          backgroundColor: '#1a1a2e',
          width: 280,
        },
        drawerActiveTintColor: '#4dabf7',
        drawerInactiveTintColor: '#a0a0a0',
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
        },
      }}
    >
      {/* 一般ユーザー向け画面 */}
      <Drawer.Screen
        name="サンドボックス"
        component={withErrorBoundary(SandboxScreen)}
        options={{
          title: 'サンドボックス（事前確認）',
          drawerLabel: 'サンドボックス',
        }}
      />
      <Drawer.Screen
        name="提出"
        component={withErrorBoundary(SubmitScreen)}
        options={{
          title: '正式提出',
          drawerLabel: '正式提出',
        }}
      />
      <Drawer.Screen
        name="履歴"
        component={withErrorBoundary(HistoryScreen)}
        options={{
          title: '提出履歴',
          drawerLabel: '提出履歴',
        }}
      />

      {/* 管理者向け画面 */}
      {isAdmin && (
        <>
          <Drawer.Screen
            name="ダッシュボード"
            component={withErrorBoundary(DashboardScreen)}
            options={{
              title: '審査ダッシュボード',
              drawerLabel: 'ダッシュボード',
            }}
          />
          <Drawer.Screen
            name="ルール"
            component={withErrorBoundary(RuleListScreen)}
            options={{
              title: 'ルール管理',
              drawerLabel: 'ルール管理',
            }}
          />
          {canAccessMaster && (
            <Drawer.Screen
              name="マスタ"
              component={withErrorBoundary(MasterScreen)}
              options={{
                title: 'マスタ管理',
                drawerLabel: 'マスタ管理',
              }}
            />
          )}
          <Drawer.Screen
            name="設定"
            component={withErrorBoundary(SettingsScreen)}
            options={{
              title: 'システム設定',
              drawerLabel: '設定',
            }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
}

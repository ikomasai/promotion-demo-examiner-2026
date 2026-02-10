/**
 * @fileoverview カスタムドロワーコンテンツ - サイドバー表示
 * @description ダークテーマのサイドバーUI。
 *              ヘッダー（ユーザー情報）、ナビゲーション、フッター（ログアウト）を含む。
 * @module navigation/components/CustomDrawerContent
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useAdmin } from '../../shared/contexts/AdminContext';

/**
 * 管理者権限の日本語表示
 * @param {string|null} role - 権限種別
 * @returns {string} 日本語表示
 */
function getRoleLabel(role) {
  switch (role) {
    case 'koho':
      return '広報部管理者';
    case 'kikaku':
      return '企画管理部管理者';
    case 'super':
      return 'スーパー管理者';
    default:
      return '一般ユーザー';
  }
}

/**
 * カスタムドロワーコンテンツ
 * @description サイドバーのカスタムUI
 *              - ヘッダー: ユーザー名、メール、管理者権限表示
 *              - ナビゲーション: ドロワーアイテム一覧
 *              - フッター: ログアウトボタン
 * @param {Object} props - DrawerContentComponentProps
 * @returns {React.ReactElement}
 */
export default function CustomDrawerContent(props) {
  const { user, profile, signOut } = useAuth();
  const { adminRole, clearAdminRole } = useAdmin();

  /**
   * ログアウト処理
   */
  const handleSignOut = async () => {
    await signOut();
  };

  /**
   * 管理者権限解除
   */
  const handleClearAdmin = async () => {
    await clearAdminRole();
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー: ユーザー情報 */}
      <View style={styles.header}>
        <Text style={styles.userName}>
          {profile?.display_name || user?.email?.split('@')[0] || 'ユーザー'}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleLabel(adminRole)}</Text>
        </View>
      </View>

      {/* ナビゲーション */}
      <DrawerContentScrollView {...props} style={styles.navigation}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* フッター: ログアウト */}
      <View style={styles.footer}>
        {adminRole && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAdmin}>
            <Text style={styles.clearButtonText}>管理者モード解除</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: '#4dabf7',
    fontWeight: '500',
  },
  navigation: {
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2d2d44',
  },
  clearButton: {
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '500',
  },
  signOutButton: {
    paddingVertical: 12,
    backgroundColor: '#f44336',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

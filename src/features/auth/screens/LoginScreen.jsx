/**
 * @fileoverview ログイン画面 - Google OAuth 認証
 * @description @kindai.ac.jp ドメインのみ許可する認証画面。
 *              Google アカウントでのログインボタンを表示。
 * @module features/auth/screens/LoginScreen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useResponsive } from '../../../shared/hooks/useResponsive';

/**
 * ログイン画面
 * @description 未認証ユーザー向けのログイン画面
 *              - アプリタイトル
 *              - ドメイン制限の説明
 *              - Google ログインボタン
 *              - エラーメッセージ表示
 * @returns {React.ReactElement}
 */
export default function LoginScreen() {
  const { signIn, error } = useAuth();
  const { isMobile } = useResponsive();

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.title, isMobile && styles.titleMobile]}>生駒祭 2026</Text>
        <Text style={styles.subtitle}>情宣AI判定システム</Text>
      </View>

      {/* 説明 */}
      <View style={styles.description}>
        <Text style={styles.descriptionText}>
          近畿大学のメールアドレス（@kindai.ac.jp）で
        </Text>
        <Text style={styles.descriptionText}>
          ログインしてください
        </Text>
      </View>

      {/* エラーメッセージ */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ログインボタン */}
      <TouchableOpacity style={styles.loginButton} onPress={signIn}>
        <Text style={styles.loginButtonText}>Google でログイン</Text>
      </TouchableOpacity>

      {/* フッター */}
      <Text style={styles.footer}>
        大学祭実行委員会 情宣局
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  titleMobile: {
    fontSize: 26,
  },
  subtitle: {
    fontSize: 16,
    color: '#4dabf7',
    fontWeight: '500',
  },
  description: {
    alignItems: 'center',
    marginBottom: 32,
  },
  descriptionText: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    maxWidth: 300,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: '#666666',
  },
});

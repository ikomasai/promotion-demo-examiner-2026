/**
 * @fileoverview Google ログインボタン - OAuth 認証トリガー
 * @description Google アイコン付きのログインボタンコンポーネント。
 *              押下で Google OAuth フローを開始。
 * @module features/auth/components/GoogleLoginButton
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

/**
 * Google ログインボタン
 * @param {Object} props
 * @param {Function} props.onPress - ボタン押下時のコールバック
 * @param {boolean} [props.loading=false] - ローディング状態
 * @param {boolean} [props.disabled=false] - 無効状態
 * @returns {React.ReactElement}
 */
export default function GoogleLoginButton({ onPress, loading = false, disabled = false }) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <Text style={styles.buttonText}>Google でログイン</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  buttonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

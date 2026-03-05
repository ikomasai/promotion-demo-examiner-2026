/**
 * @fileoverview ログイン画面 - Email/Password 認証
 * @description @kindai.ac.jp ドメインのみ許可する認証画面。
 * @module features/auth/screens/LoginScreen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { ALLOWED_DOMAIN } from '../../../shared/utils/validateEmail';

/**
 * ログイン画面
 * @returns {React.ReactElement}
 */
export default function LoginScreen() {
  const { signIn, error } = useAuth();
  const { isMobile } = useResponsive();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const displayError = localError || error;

  const handleSubmit = async () => {
    setLocalError(null);

    // 空欄チェック
    if (!email.trim() || !password) {
      setLocalError('メールアドレスとパスワードを入力してください。');
      return;
    }

    // ドメインチェック
    if (!email.trim().endsWith(ALLOWED_DOMAIN)) {
      setLocalError('@kindai.ac.jp のメールアドレスを使用してください。');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.title, isMobile && styles.titleMobile]}>生駒祭 2026</Text>
        <Text style={styles.subtitle}>情宣AI判定システム</Text>
      </View>

      {/* フォーム */}
      <View style={[styles.form, isMobile && styles.formMobile]}>
        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="example@kindai.ac.jp"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
        />

        <Text style={styles.label}>パスワード</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="6文字以上"
          placeholderTextColor="#666"
          secureTextEntry
          autoComplete="current-password"
          editable={!loading}
        />

        {/* エラーメッセージ */}
        {displayError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        )}

        {/* 送信ボタン */}
        <TouchableOpacity
          testID="submit-button"
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>ログイン</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* フッター */}
      <Text style={styles.footer}>大学祭実行委員会 情宣局</Text>
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
    marginBottom: 32,
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
  form: {
    width: '100%',
    maxWidth: 360,
  },
  formMobile: {
    maxWidth: 320,
  },
  label: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#4dabf7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
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

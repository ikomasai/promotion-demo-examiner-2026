/**
 * @fileoverview ログイン画面 - Email/Password 認証
 * @description @kindai.ac.jp ドメインのみ許可する認証画面。
 * @module features/auth/screens/LoginScreen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import FormInput from '../../../shared/components/FormInput';
import Banner from '../../../shared/components/Banner';
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
        <FormInput
          label="メールアドレス"
          value={email}
          onChangeText={setEmail}
          placeholder="example@kindai.ac.jp"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
          style={styles.field}
        />

        <FormInput
          label="パスワード"
          value={password}
          onChangeText={setPassword}
          placeholder="6文字以上"
          secureTextEntry
          autoComplete="current-password"
          editable={!loading}
          style={styles.field}
        />

        {/* エラーメッセージ */}
        {displayError && (
          <Banner variant="error" style={styles.errorBanner}>
            {displayError}
          </Banner>
        )}

        {/* 送信ボタン */}
        <Button
          testID="submit-button"
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          disabled={loading}
          loading={loading}
        >
          ログイン
        </Button>
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
    backgroundColor: colors.bg.primary,
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  titleMobile: {
    fontSize: 26,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  form: {
    width: '100%',
    maxWidth: 360,
  },
  formMobile: {
    maxWidth: 320,
  },
  field: {
    marginBottom: spacing.lg,
  },
  errorBanner: {
    marginBottom: spacing.lg,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    ...typography.caption,
    color: colors.text.disabled,
  },
});

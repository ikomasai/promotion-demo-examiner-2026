/**
 * @fileoverview パスワード変更モーダル
 * @description 管理者がロール別パスワードを変更するモーダル。
 *              旧パスワード確認なし（既にadmin認証済み前提）。
 *              update-password Edge Function を呼び出す。
 * @module features/settings/components/PasswordChangeModal
 */

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import FormInput from '../../../shared/components/FormInput';

import { supabase } from '../../../services/supabase/client';
import { ROLE_LABELS, MIN_PASSWORD_LENGTH } from '../../../shared/constants/adminConfig';

/**
 * パスワード変更モーダル
 */
export default function PasswordChangeModal({ visible, role, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [visible]);

  const roleLabel = role ? ROLE_LABELS[role] : '';

  const validate = () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH)
      return `パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください`;
    if (newPassword !== confirmPassword) return 'パスワードが一致しません';
    return null;
  };

  const canSubmit =
    newPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword && !submitting;

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('update-password', {
        body: { role, newPassword },
      });

      if (funcError) {
        setError('パスワード変更処理中にエラーが発生しました');
        return;
      }

      if (!data?.success) {
        setError(data?.error || 'パスワードの変更に失敗しました');
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('PasswordChangeModal error:', err);
      setError('予期しないエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>パスワード変更</Text>
          <Text style={styles.subtitle}>{roleLabel}のパスワードを変更します</Text>

          <FormInput
            label="新しいパスワード"
            placeholder={`${MIN_PASSWORD_LENGTH}文字以上`}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!submitting}
            style={styles.field}
          />

          <FormInput
            label="パスワード確認"
            placeholder="もう一度入力"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!submitting}
            error={error}
            style={styles.field}
          />

          <View style={styles.buttonContainer}>
            <Button variant="outline-muted" onPress={handleClose} disabled={submitting}>
              キャンセル
            </Button>
            <Button
              variant="primary"
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
            >
              変更する
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: colors.bg.primary,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    ...typography.heading3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.tertiary,
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
});

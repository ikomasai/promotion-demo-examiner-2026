/**
 * @fileoverview パスワード変更モーダル
 * @description 管理者がロール別パスワードを変更するモーダル。
 *              旧パスワード確認なし（既にadmin認証済み前提）。
 *              update-password Edge Function を呼び出す。
 * @module features/settings/components/PasswordChangeModal
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../services/supabase/client';

/** ロール → 表示名 */
const ROLE_LABELS = {
  koho: '広報部',
  kikaku: '企画管理部',
  super: '管理者',
};

/**
 * パスワード変更モーダル
 * @param {Object} props
 * @param {boolean} props.visible - 表示状態
 * @param {'koho'|'kikaku'|'super'|null} props.role - 対象ロール
 * @param {() => void} props.onClose - 閉じるコールバック
 * @param {() => void} props.onSuccess - 変更成功コールバック
 */
export default function PasswordChangeModal({ visible, role, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // モーダル表示時にリセット
  useEffect(() => {
    if (visible) {
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [visible]);

  const roleLabel = role ? ROLE_LABELS[role] : '';

  /** バリデーション */
  const validate = () => {
    if (newPassword.length < 4) {
      return 'パスワードは4文字以上で入力してください';
    }
    if (newPassword !== confirmPassword) {
      return 'パスワードが一致しません';
    }
    return null;
  };

  const canSubmit = newPassword.length >= 4 && newPassword === confirmPassword && !submitting;

  /** 送信 */
  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const { data, error: funcError } = await supabase.functions.invoke(
        'update-password',
        { body: { role, newPassword } }
      );

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
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* ヘッダー */}
          <Text style={styles.title}>パスワード変更</Text>
          <Text style={styles.subtitle}>
            {roleLabel}のパスワードを変更します
          </Text>

          {/* 新しいパスワード */}
          <Text style={styles.inputLabel}>新しいパスワード</Text>
          <TextInput
            style={styles.input}
            placeholder="4文字以上"
            placeholderTextColor="#666666"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!submitting}
          />

          {/* パスワード確認 */}
          <Text style={styles.inputLabel}>パスワード確認</Text>
          <TextInput
            style={styles.input}
            placeholder="もう一度入力"
            placeholderTextColor="#666666"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!submitting}
          />

          {/* エラーメッセージ */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>変更する</Text>
              )}
            </TouchableOpacity>
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
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2d2d44',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a0a0a0',
  },
  cancelButtonText: {
    color: '#a0a0a0',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4dabf7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.7,
  },
});

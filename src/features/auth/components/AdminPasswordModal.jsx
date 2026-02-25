/**
 * @fileoverview 管理者パスワードモーダル - 権限認証UI
 * @description 管理者パスワード入力用モーダル。
 *              3つの権限種別（koho/kikaku/super）から選択し、
 *              認証成功時にセッション内で screen 権限が付与される。
 * @module features/auth/components/AdminPasswordModal
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAdmin } from '../../../shared/contexts/AdminContext';

/**
 * 権限オプション定義
 * @type {Array<{value: string, label: string, description: string}>}
 */
const ROLE_OPTIONS = [
  {
    value: 'koho',
    label: '広報部',
    description: '広報部宛（koho）提出の審査が可能',
  },
  {
    value: 'kikaku',
    label: '企画管理部',
    description: '企画管理部宛（kikaku）提出の審査が可能',
  },
  {
    value: 'super',
    label: '管理者',
    description: '全機能にアクセス可能（設定・マスタ管理含む）',
  },
];

/**
 * 管理者パスワードモーダル
 * @description 権限種別を選択してパスワードを入力する認証モーダル。
 *              認証成功時に AdminContext の screen 権限が更新される。
 * @param {Object} props
 * @param {boolean} props.visible - モーダル表示状態
 * @param {Function} props.onClose - 閉じる時のコールバック
 * @param {Function} [props.onSuccess] - 認証成功時のコールバック
 * @returns {React.ReactElement}
 */
export default function AdminPasswordModal({ visible, onClose, onSuccess }) {
  const { verifyPassword, verifying, error, clearError } = useAdmin();
  const [selectedRole, setSelectedRole] = useState('koho');
  const [password, setPassword] = useState('');

  /**
   * 認証実行
   */
  const handleVerify = async () => {
    if (!password.trim()) return;
    clearError();

    const success = await verifyPassword(selectedRole, password);
    if (success) {
      setPassword('');
      onSuccess?.();
      onClose();
    }
  };

  /**
   * モーダルを閉じる
   */
  const handleClose = () => {
    setPassword('');
    onClose();
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
          <Text style={styles.title}>管理者認証</Text>
          <Text style={styles.subtitle}>
            権限を選択してパスワードを入力してください
          </Text>

          {/* 権限選択 */}
          <View style={styles.roleContainer}>
            {ROLE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.roleOption,
                  selectedRole === option.value && styles.roleOptionSelected,
                ]}
                onPress={() => setSelectedRole(option.value)}
              >
                <Text
                  style={[
                    styles.roleLabel,
                    selectedRole === option.value && styles.roleLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.roleDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* パスワード入力 */}
          <TextInput
            style={styles.input}
            placeholder="パスワード"
            placeholderTextColor="#666666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!verifying}
          />

          {/* エラーメッセージ */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={verifying}
            >
              <Text style={styles.cancelButtonText}>スキップ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.verifyButton, !password.trim() && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={verifying || !password.trim()}
            >
              {verifying ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>認証</Text>
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
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 20,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleOption: {
    backgroundColor: '#2d2d44',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleOptionSelected: {
    borderColor: '#4dabf7',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  roleLabelSelected: {
    color: '#4dabf7',
  },
  roleDescription: {
    fontSize: 12,
    color: '#a0a0a0',
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
  verifyButton: {
    backgroundColor: '#4dabf7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.7,
  },
});

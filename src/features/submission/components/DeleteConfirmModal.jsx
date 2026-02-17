/**
 * @fileoverview 削除確認モーダル
 * @description pending 提出の削除前に表示する確認ダイアログ。
 *              SubmissionConfirmModal のパターンを踏襲。
 * @module features/submission/components/DeleteConfirmModal
 */

import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

/**
 * 削除確認モーダル
 * @param {{
 *   visible: boolean,
 *   submission: Object|null,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 *   deleting: boolean
 * }} props
 */
export default function DeleteConfirmModal({ visible, submission, onConfirm, onCancel, deleting }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>提出を削除</Text>

          <Text style={styles.fileName} numberOfLines={2}>
            {submission?.file_name}
          </Text>

          <Text style={styles.message}>
            この提出を削除しますか？{'\n'}
            この操作は取り消せません。
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={deleting}
            >
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
              onPress={onConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.deleteText}>削除する</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modal: {
    backgroundColor: '#2d2d44',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  fileName: {
    fontSize: 14,
    color: '#e0e0e0',
    textAlign: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelText: {
    color: '#a0a0a0',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f44336',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

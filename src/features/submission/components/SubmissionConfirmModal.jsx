/**
 * @fileoverview 中リスク提出確認モーダル
 * @description リスクスコア11-50%の場合に表示する確認ダイアログ。
 * @module features/submission/components/SubmissionConfirmModal
 */

import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * 中リスク時の提出確認モーダル
 * @param {{
 *   visible: boolean,
 *   score: number|null,
 *   onConfirm: () => void,
 *   onCancel: () => void
 * }} props
 */
export default function SubmissionConfirmModal({ visible, score, onConfirm, onCancel }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>提出確認</Text>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>リスクスコア</Text>
            <Text style={styles.scoreValue}>{score ?? '--'}%</Text>
          </View>

          <Text style={styles.message}>
            注意事項がある可能性があります。提出しますか？
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmText}>提出する</Text>
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
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ff9800',
  },
  message: {
    fontSize: 14,
    color: '#e0e0e0',
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
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ff9800',
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

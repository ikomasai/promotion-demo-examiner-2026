/**
 * @fileoverview 自動承認 免責確認モーダル
 * @description 自動承認機能を有効化する前に免責事項の同意を求める。
 *              確認ボタンは警告色（#ff9800）で重大さを示す。
 * @module features/settings/components/AutoApproveWarningModal
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

/**
 * 自動承認 免責確認モーダル
 * @param {Object} props
 * @param {boolean} props.visible - 表示状態
 * @param {() => void} props.onConfirm - 有効化を確認
 * @param {() => void} props.onCancel - キャンセル（トグルOFFに戻る）
 */
export default function AutoApproveWarningModal({ visible, onConfirm, onCancel }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ヘッダー */}
            <Text style={styles.warningIcon}>⚠</Text>
            <Text style={styles.title}>自動承認機能の有効化</Text>

            {/* 免責テキスト */}
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                自動承認機能を有効にすると、AIの判定スコアが閾値以上の提出物は人間の審査を経ずに自動的に承認されます。
              </Text>
              <Text style={styles.disclaimerText}>
                {'\n'}この機能を有効にした場合、以下のリスクを理解し同意したものとみなします：
              </Text>
              <Text style={styles.riskItem}>
                • AI判定は完全ではなく、不適切な素材が承認される可能性があります
              </Text>
              <Text style={styles.riskItem}>
                • 自動承認された素材に関する責任は管理者が負います
              </Text>
              <Text style={styles.riskItem}>
                • 問題が発生した場合、手動で承認を取り消す必要があります
              </Text>
            </View>
          </ScrollView>

          {/* ボタン */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>有効化する</Text>
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
    borderRadius: 16,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: 20,
  },
  disclaimerBox: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 22,
  },
  riskItem: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 22,
    marginTop: 4,
    paddingLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#3d3d5c',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2d2d44',
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

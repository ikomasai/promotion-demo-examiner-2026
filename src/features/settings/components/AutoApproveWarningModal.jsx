/**
 * @fileoverview 自動承認 免責確認モーダル
 * @description 自動承認機能を有効化する前に免責事項の同意を求める。
 * @module features/settings/components/AutoApproveWarningModal
 */

import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Button from '../../../shared/components/Button';

/**
 * 自動承認 免責確認モーダル
 * @param {Object} props
 * @param {boolean} props.visible - 表示状態
 * @param {() => void} props.onConfirm - 有効化を確認
 * @param {() => void} props.onCancel - キャンセル（トグルOFFに戻る）
 */
export default function AutoApproveWarningModal({ visible, onConfirm, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.warningIcon}>⚠</Text>
            <Text style={styles.title}>自動承認機能の有効化</Text>

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

          <View style={styles.actions}>
            <Button variant="muted" onPress={onCancel} style={styles.flex}>
              キャンセル
            </Button>
            <Button variant="warning" onPress={onConfirm} style={styles.flex}>
              有効化する
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
    borderRadius: radii.xl,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xxl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading4,
    color: colors.accent.warning,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  disclaimerBox: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.warning,
  },
  disclaimerText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  riskItem: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: spacing.xs,
    paddingLeft: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xxl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  flex: {
    flex: 1,
  },
});

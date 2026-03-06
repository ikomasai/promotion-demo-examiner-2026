/**
 * @fileoverview 中リスク提出確認モーダル
 * @description リスクスコア11-50%の場合に表示する確認ダイアログ。
 * @module features/submission/components/SubmissionConfirmModal
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import Button from '../../../shared/components/Button';

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
    <ConfirmModal
      visible={visible}
      title="提出確認"
      onClose={onCancel}
      actions={
        <>
          <Button variant="outline-muted" onPress={onCancel} style={styles.flex}>
            キャンセル
          </Button>
          <Button variant="warning" onPress={onConfirm} style={styles.flex}>
            提出する
          </Button>
        </>
      }
    >
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>リスクスコア</Text>
        <Text style={styles.scoreValue}>{score ?? '--'}%</Text>
      </View>
      <Text style={styles.message}>
        注意事項がある可能性があります。提出しますか？
      </Text>
    </ConfirmModal>
  );
}

const styles = StyleSheet.create({
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent.warning,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
});

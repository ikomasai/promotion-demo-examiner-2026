/**
 * @fileoverview 削除確認モーダル
 * @description pending 提出の削除前に表示する確認ダイアログ。
 * @module features/submission/components/DeleteConfirmModal
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import Button from '../../../shared/components/Button';

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
    <ConfirmModal
      visible={visible}
      title="提出を削除"
      onClose={onCancel}
      actions={
        <>
          <Button
            variant="outline-muted"
            onPress={onCancel}
            disabled={deleting}
            style={styles.flex}
          >
            キャンセル
          </Button>
          <Button
            variant="danger"
            onPress={onConfirm}
            disabled={deleting}
            loading={deleting}
            style={styles.flex}
          >
            削除する
          </Button>
        </>
      }
    >
      <Text style={styles.fileName} numberOfLines={2}>
        {submission?.file_name}
      </Text>
      <Text style={styles.message}>
        この提出を削除しますか？{'\n'}
        この操作は取り消せません。
      </Text>
    </ConfirmModal>
  );
}

const styles = StyleSheet.create({
  fileName: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    backgroundColor: colors.bg.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  message: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
});

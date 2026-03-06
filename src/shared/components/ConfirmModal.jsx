/**
 * @fileoverview 共通確認モーダルコンポーネント
 * @module shared/components/ConfirmModal
 */

import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '../theme';

/**
 * 共通確認モーダル
 * @param {{
 *   visible: boolean,
 *   title: string,
 *   onClose: () => void,
 *   children?: React.ReactNode,
 *   actions: React.ReactNode,
 *   maxWidth?: number,
 * }} props
 */
export default function ConfirmModal({ visible, title, onClose, children, actions, maxWidth = 400 }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { maxWidth }]}>
          <Text style={styles.title}>{title}</Text>
          {children}
          <View style={styles.actions}>{actions}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.bg.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  modal: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    width: '100%',
  },
  title: {
    ...typography.heading4,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});

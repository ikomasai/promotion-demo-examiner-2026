/**
 * @fileoverview ドロップダウン Select コンポーネント共通スタイル
 * @module shared/styles/selectStyles
 */

import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme';

/** React Native StyleSheet（loading, error 用） */
export const selectNativeStyles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: colors.bg.elevated,
    padding: spacing.lg,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  error: {
    color: colors.accent.danger,
    fontSize: 12,
  },
});

/** HTML select のインラインスタイル（StyleSheet は DOM 要素に適用不可） */
export const selectInlineStyle = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: colors.bg.elevated,
  color: '#fff',
  border: `1px solid ${colors.border.default}`,
  borderRadius: `${radii.sm}px`,
  fontSize: '14px',
  appearance: 'auto',
  cursor: 'pointer',
};

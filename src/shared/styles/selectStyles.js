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
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
  cursor: 'pointer',
  outline: 'none',
};

/** フォーカス時のインラインスタイル（selectInlineStyle とマージして使用） */
export const selectFocusedInlineStyle = {
  ...selectInlineStyle,
  borderColor: colors.accent.primary,
};

/**
 * @fileoverview 共通バナーコンポーネント（エラー・警告・成功・情報）
 * @module shared/components/Banner
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '../theme';

const VARIANT_STYLES = {
  error: { bg: colors.surfaceTint.warning, border: colors.accent.warning, text: colors.accent.warning },
  warning: { bg: colors.surfaceTint.warning, border: colors.accent.warning, text: colors.accent.warning },
  success: { bg: colors.surfaceTint.success, border: colors.accent.success, text: colors.accent.success },
  info: { bg: colors.surfaceTint.primary, border: colors.accent.primary, text: colors.accent.primary },
};

/**
 * 共通バナー
 * @param {{
 *   variant?: 'error'|'warning'|'success'|'info',
 *   children: string|React.ReactNode,
 *   style?: object,
 * }} props
 */
export default function Banner({ variant = 'error', children, style }) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.error;
  return (
    <View style={[styles.base, { backgroundColor: v.bg, borderColor: v.border }, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, { color: v.text }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    textAlign: 'center',
  },
});

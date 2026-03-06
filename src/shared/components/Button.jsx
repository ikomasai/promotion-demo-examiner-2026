/**
 * @fileoverview 共通ボタンコンポーネント
 * @module shared/components/Button
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '../theme';

const VARIANT_STYLES = {
  primary: { bg: colors.accent.primary },
  warning: { bg: colors.accent.warning },
  danger: { bg: colors.accent.danger },
  success: { bg: colors.accent.success },
  muted: { bg: colors.text.disabled },
  outline: { bg: 'transparent', borderColor: colors.accent.primary, textColor: colors.accent.primary },
  'outline-warning': { bg: 'transparent', borderColor: colors.accent.warning, textColor: colors.accent.warning },
  'outline-danger': { bg: 'transparent', borderColor: colors.accent.danger, textColor: colors.accent.danger },
  'outline-muted': { bg: 'transparent', borderColor: colors.text.disabled, textColor: colors.text.tertiary },
};

const SIZE_STYLES = {
  sm: { paddingVertical: 10, paddingHorizontal: spacing.lg, fontSize: 13 },
  md: { paddingVertical: 14, paddingHorizontal: spacing.xl, fontSize: 14 },
  lg: { paddingVertical: 16, paddingHorizontal: spacing.xxl, fontSize: 16 },
};

/**
 * 共通ボタン
 * @param {{
 *   variant?: 'primary'|'warning'|'danger'|'success'|'muted'|'outline'|'outline-warning'|'outline-danger'|'outline-muted',
 *   size?: 'sm'|'md'|'lg',
 *   disabled?: boolean,
 *   loading?: boolean,
 *   children: string,
 *   onPress: () => void,
 *   style?: object,
 * }} props
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onPress,
  style,
}) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const s = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isOutline = variant.startsWith('outline');
  const textColor = v.textColor || colors.text.primary;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: v.bg, paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
        isOutline && { borderWidth: 1, borderColor: v.borderColor },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize: s.fontSize }]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

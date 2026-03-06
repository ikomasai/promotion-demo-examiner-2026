/**
 * @fileoverview 共通フォーム入力コンポーネント
 * @module shared/components/FormInput
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '../theme';

/**
 * 共通フォーム入力
 * @param {{
 *   label?: string,
 *   error?: string,
 *   style?: object,
 *   inputStyle?: object,
 *   [key: string]: any,
 * }} props - TextInput の全 Props を透過
 */
export default function FormInput({ label, error, style, inputStyle, ...inputProps }) {
  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, inputStyle]}
        placeholderTextColor={colors.text.muted}
        {...inputProps}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg.elevated,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.sm,
    padding: spacing.md,
    ...typography.body,
  },
  inputError: {
    borderColor: colors.accent.danger,
  },
  error: {
    ...typography.caption,
    color: colors.accent.danger,
    marginTop: spacing.xs,
  },
});

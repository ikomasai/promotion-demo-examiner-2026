/**
 * @fileoverview ローディングスピナー - 読み込み中表示
 * @description アプリ全体で使用する共通のローディング表示。
 *              メッセージカスタマイズ可能。
 * @module shared/components/LoadingSpinner
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

/**
 * ローディングスピナー
 * @param {Object} props
 * @param {string} [props.message='読み込み中...'] - 表示メッセージ
 * @param {string} [props.size='large'] - スピナーサイズ (small/large)
 * @returns {React.ReactElement}
 */
export default function LoadingSpinner({ message = '読み込み中...', size = 'large' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.accent.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    padding: spacing.xl,
  },
  message: {
    marginTop: spacing.lg,
    fontSize: 14,
    color: colors.text.tertiary,
  },
});

/**
 * @fileoverview 共通カードコンポーネント
 * @module shared/components/Card
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '../theme';

/**
 * 共通カード
 * @param {{
 *   children: React.ReactNode,
 *   padding?: number,
 *   style?: object,
 * }} props
 */
export default function Card({ children, padding = spacing.lg, style }) {
  return (
    <View style={[styles.base, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
});

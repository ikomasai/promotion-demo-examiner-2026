/**
 * @fileoverview 共通バッジコンポーネント
 * @module shared/components/Badge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radii, spacing } from '../theme';

/**
 * 共通バッジ
 * @param {{
 *   label: string,
 *   bg: string,
 *   color: string,
 *   size?: 'sm'|'md',
 *   style?: object,
 * }} props
 */
export default function Badge({ label, bg, color, size = 'sm', style }) {
  const isMd = size === 'md';
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingHorizontal: isMd ? spacing.md : spacing.sm,
          paddingVertical: isMd ? spacing.xs + 2 : spacing.xs,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color, fontSize: isMd ? 13 : 11 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});

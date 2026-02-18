/**
 * @fileoverview カード型スケルトン
 * @description SubmissionCard / RuleDocumentCard の形状を模倣したスケルトン。
 *              リスト画面のローディング状態で使用。
 * @module shared/components/SkeletonCard
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

/**
 * カード型スケルトン
 * @param {{ style?: import('react-native').ViewStyle }} props
 */
export default function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      {/* Row 1: バッジ */}
      <View style={styles.row}>
        <SkeletonLoader width={64} height={22} borderRadius={12} />
        <SkeletonLoader width={48} height={22} borderRadius={12} />
      </View>

      {/* Row 2: タイトル */}
      <SkeletonLoader width="75%" height={16} style={styles.spacer} />

      {/* Row 3: メタデータ */}
      <SkeletonLoader width="55%" height={14} style={styles.spacer} />

      {/* Row 4: 下部 */}
      <View style={[styles.row, styles.spacerLarge]}>
        <SkeletonLoader width={80} height={14} />
        <SkeletonLoader width={60} height={28} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spacer: {
    marginTop: 10,
  },
  spacerLarge: {
    marginTop: 14,
    justifyContent: 'space-between',
  },
});

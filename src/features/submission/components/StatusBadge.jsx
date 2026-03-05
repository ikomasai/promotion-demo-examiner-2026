/**
 * @fileoverview 提出ステータスバッジ
 * @description pending/approved/rejected の状態を色分けピルバッジで表示。
 * @module features/submission/components/StatusBadge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_CONFIG } from '../../../shared/constants/statusConfig';

/**
 * ステータスバッジ
 * @param {{ status: 'pending'|'approved'|'rejected' }} props
 */
export default React.memo(function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

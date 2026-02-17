/**
 * @fileoverview 提出ステータスバッジ
 * @description pending/approved/rejected の状態を色分けピルバッジで表示。
 * @module features/submission/components/StatusBadge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_MAP = {
  pending:  { bg: '#3d3520', text: '#ff9800', label: '審査中' },
  approved: { bg: '#1e3525', text: '#4caf50', label: '承認済' },
  rejected: { bg: '#3d1e1e', text: '#f44336', label: '却下' },
};

/**
 * ステータスバッジ
 * @param {{ status: 'pending'|'approved'|'rejected' }} props
 */
export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || STATUS_MAP.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
}

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

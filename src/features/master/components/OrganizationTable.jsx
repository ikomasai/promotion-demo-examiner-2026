/**
 * @fileoverview 団体一覧テーブル
 * @description 団体マスタデータをテーブル形式で表示。
 * @module features/master/components/OrganizationTable
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * 団体一覧テーブル
 * @param {{ organizations: Array }} props
 */
export default function OrganizationTable({ organizations }) {
  if (!organizations || organizations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>団体データがありません</Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      {/* ヘッダー行 */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.codeCol]}>コード</Text>
        <Text style={[styles.headerCell, styles.nameCol]}>団体名</Text>
        <Text style={[styles.headerCell, styles.categoryCol]}>カテゴリ</Text>
      </View>

      {/* データ行 */}
      {organizations.map((org) => (
        <View key={org.id} style={styles.dataRow}>
          <Text style={[styles.codeText, styles.codeCol]} numberOfLines={1}>
            {org.organization_code}
          </Text>
          <Text style={[styles.nameText, styles.nameCol]} numberOfLines={1}>
            {org.organization_name}
          </Text>
          <Text style={[styles.categoryText, styles.categoryCol]} numberOfLines={1}>
            {org.category || '—'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#1e2d44',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4dabf7',
  },
  dataRow: {
    flexDirection: 'row',
    backgroundColor: '#2d2d44',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#3d3d5c',
  },
  codeCol: {
    width: 100,
  },
  nameCol: {
    flex: 1,
    marginHorizontal: 8,
  },
  categoryCol: {
    width: 100,
  },
  codeText: {
    fontSize: 13,
    color: '#4dabf7',
    fontFamily: 'monospace',
  },
  nameText: {
    fontSize: 13,
    color: '#ffffff',
  },
  categoryText: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#2d2d44',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
});

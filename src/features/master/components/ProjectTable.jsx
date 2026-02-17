/**
 * @fileoverview 企画一覧テーブル
 * @description 企画マスタデータをテーブル形式で表示。
 * @module features/master/components/ProjectTable
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * 企画一覧テーブル
 * @param {{ projects: Array }} props
 */
export default function ProjectTable({ projects }) {
  if (!projects || projects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>企画データがありません</Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      {/* ヘッダー行 */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.codeCol]}>コード</Text>
        <Text style={[styles.headerCell, styles.nameCol]}>企画名</Text>
        <Text style={[styles.headerCell, styles.orgCol]}>団体コード</Text>
      </View>

      {/* データ行 */}
      {projects.map((proj) => (
        <View key={proj.id} style={styles.dataRow}>
          <Text style={[styles.codeText, styles.codeCol]} numberOfLines={1}>
            {proj.project_code}
          </Text>
          <Text style={[styles.nameText, styles.nameCol]} numberOfLines={1}>
            {proj.project_name}
          </Text>
          <Text style={[styles.orgText, styles.orgCol]} numberOfLines={1}>
            {proj.organization?.organization_code || '—'}
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
  orgCol: {
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
  orgText: {
    fontSize: 13,
    color: '#a0a0a0',
    fontFamily: 'monospace',
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

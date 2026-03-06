/**
 * @fileoverview ダッシュボードフィルタバー
 * @description ステータスタブ（pill ボタン）、提出先トグル（admin のみ）、
 *              自動承認フィルタ（T053a）を提供。
 * @module features/review/components/DashboardFilters
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

/** ステータスタブの設定 */
const STATUS_TABS = [
  { key: null, label: '全て', color: '#4dabf7' },
  { key: 'pending', label: '審査中', color: '#ff9800' },
  { key: 'approved', label: '承認済', color: '#4caf50' },
  { key: 'rejected', label: '却下', color: '#f44336' },
];

/** 提出先タブの設定 */
const TYPE_TABS = [
  { key: null, label: '全て' },
  { key: 'koho', label: '広報部' },
  { key: 'kikaku', label: '企画管理部' },
];

/** 自動承認フィルタの設定 */
const AUTO_APPROVE_TABS = [
  { key: null, label: '全て' },
  { key: 'auto_only', label: '自動承認のみ' },
  { key: 'manual_only', label: '手動審査のみ' },
];

/**
 * ピルボタン
 */
function PillButton({ label, active, color, count, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        active && { backgroundColor: color ? `${color}22` : '#3d3d5c' },
        active && color && { borderColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.pillText, active && { color: color || '#ffffff' }]}>
        {label}
        {count !== undefined && <Text style={styles.pillCount}> ({count})</Text>}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * ダッシュボードフィルタ
 * @param {{
 *   filters: { status: string|null, submissionType: string|null, autoApproveFilter: string|null },
 *   onFiltersChange: (filters: Object) => void,
 *   stats: { pending: number, approved: number, rejected: number, total: number },
 *   isAdmin: boolean
 * }} props
 */
/** デフォルトフィルタ値 */
const DEFAULT_FILTERS = {
  status: 'pending',
  submissionType: null,
  autoApproveFilter: null,
};

export default function DashboardFilters({ filters, onFiltersChange, stats, isAdmin }) {
  const getCount = (statusKey) => {
    if (statusKey === null) return stats.total;
    return stats[statusKey] || 0;
  };

  const hasNonDefaultFilter =
    filters.status !== DEFAULT_FILTERS.status ||
    filters.submissionType !== DEFAULT_FILTERS.submissionType ||
    filters.autoApproveFilter !== DEFAULT_FILTERS.autoApproveFilter;

  return (
    <View style={styles.container}>
      {/* Row 1: ステータスタブ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {STATUS_TABS.map((tab) => (
          <PillButton
            key={tab.key || 'all'}
            label={tab.label}
            active={filters.status === tab.key}
            color={tab.color}
            count={getCount(tab.key)}
            onPress={() => onFiltersChange({ ...filters, status: tab.key })}
          />
        ))}
      </ScrollView>

      {/* Row 2: 提出先トグル（admin のみ） */}
      {isAdmin && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {TYPE_TABS.map((tab) => (
            <PillButton
              key={tab.key || 'type-all'}
              label={tab.label}
              active={filters.submissionType === tab.key}
              onPress={() => onFiltersChange({ ...filters, submissionType: tab.key })}
            />
          ))}
        </ScrollView>
      )}

      {/* Row 3: 自動承認フィルタ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {AUTO_APPROVE_TABS.map((tab) => (
          <PillButton
            key={tab.key || 'auto-all'}
            label={tab.label}
            active={filters.autoApproveFilter === tab.key}
            onPress={() => onFiltersChange({ ...filters, autoApproveFilter: tab.key })}
          />
        ))}
      </ScrollView>

      {/* クリアボタン */}
      {hasNonDefaultFilter && (
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onFiltersChange(DEFAULT_FILTERS)}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>フィルターをクリア</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    gap: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3d3d5c',
    backgroundColor: '#2d2d44',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  pillCount: {
    fontWeight: '400',
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#4dabf7',
    fontWeight: '500',
  },
});

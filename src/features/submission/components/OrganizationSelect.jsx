/**
 * @fileoverview 団体選択ドロップダウン
 * @module features/submission/components/OrganizationSelect
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useOrganizations } from '../hooks/useOrganizations';

/**
 * 団体選択コンポーネント
 * @param {{ value: string|null, onChange: (id: string|null) => void, disabled: boolean }} props
 */
export default function OrganizationSelect({ value, onChange, disabled }) {
  const { organizations, loading, error } = useOrganizations();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4dabf7" />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      style={styles.select}
    >
      <option value="">団体を選択してください</option>
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.organization_name}
          {org.category ? ` (${org.category})` : ''}
        </option>
      ))}
    </select>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: '#2d2d44',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  error: {
    color: '#f44336',
    fontSize: 12,
  },
});

// HTML select のインラインスタイル（StyleSheet は DOM 要素に適用不可）
styles.select = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#2d2d44',
  color: '#fff',
  border: '1px solid #3d3d5c',
  borderRadius: '8px',
  fontSize: '14px',
  appearance: 'auto',
  cursor: 'pointer',
};

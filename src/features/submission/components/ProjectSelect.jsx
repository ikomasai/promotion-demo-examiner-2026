/**
 * @fileoverview 企画選択ドロップダウン（団体でフィルタ）
 * @module features/submission/components/ProjectSelect
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useProjects } from '../hooks/useProjects';

/**
 * 企画選択コンポーネント
 * @param {{
 *   value: string|null,
 *   onChange: (id: string|null) => void,
 *   organizationId: string|null,
 *   disabled: boolean
 * }} props
 */
export default function ProjectSelect({ value, onChange, organizationId, disabled }) {
  const { projects, loading, error } = useProjects(organizationId);

  if (!organizationId) {
    return (
      <select disabled style={styles.select}>
        <option>団体を先に選択してください</option>
      </select>
    );
  }

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
      <option value="">企画を選択してください</option>
      {projects.map((proj) => (
        <option key={proj.id} value={proj.id}>
          {proj.project_name}
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

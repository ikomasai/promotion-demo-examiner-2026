/**
 * @fileoverview 団体選択ドロップダウン
 * @module features/submission/components/OrganizationSelect
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useOrganizations } from '../hooks/useOrganizations';
import { selectNativeStyles, selectInlineStyle } from '../../../shared/styles/selectStyles';

/**
 * 団体選択コンポーネント
 * @param {{ value: string|null, onChange: (id: string|null) => void, disabled: boolean }} props
 */
export default function OrganizationSelect({ value, onChange, disabled }) {
  const { organizations, loading, error } = useOrganizations();

  if (loading) {
    return (
      <View style={selectNativeStyles.loadingContainer}>
        <ActivityIndicator size="small" color="#4dabf7" />
      </View>
    );
  }

  if (error) {
    return <Text style={selectNativeStyles.error}>{error}</Text>;
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      style={selectInlineStyle}
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

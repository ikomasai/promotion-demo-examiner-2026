/**
 * @fileoverview 企画選択ドロップダウン（団体でフィルタ）
 * @module features/submission/components/ProjectSelect
 */

import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useProjects } from '../hooks/useProjects';
import {
  selectNativeStyles,
  selectInlineStyle,
  selectFocusedInlineStyle,
} from '../../../shared/styles/selectStyles';

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
  const [focused, setFocused] = useState(false);
  const { projects, loading, error } = useProjects(organizationId);

  if (!organizationId) {
    return (
      <select disabled style={selectInlineStyle}>
        <option>団体を先に選択してください</option>
      </select>
    );
  }

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
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      style={focused ? selectFocusedInlineStyle : selectInlineStyle}
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

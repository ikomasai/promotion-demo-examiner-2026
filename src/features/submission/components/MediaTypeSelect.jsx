/**
 * @fileoverview 媒体種別選択ドロップダウン
 * @module features/submission/components/MediaTypeSelect
 */

import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useMediaSpecs } from '../hooks/useMediaSpecs';
import {
  selectNativeStyles,
  selectInlineStyle,
  selectFocusedInlineStyle,
} from '../../../shared/styles/selectStyles';

/**
 * 媒体種別選択コンポーネント
 * @param {{
 *   value: string|null,
 *   onChange: (mediaType: string|null, spec: Object|null) => void,
 *   disabled: boolean
 * }} props
 * @description onChange は mediaType 文字列とフル spec オブジェクトの両方を返す。
 *              SubmissionForm が spec を FileUploader に渡してバリデーションに使用。
 */
export default function MediaTypeSelect({ value, onChange, disabled }) {
  const [focused, setFocused] = useState(false);
  const { mediaSpecs, loading, error, getSpecByType } = useMediaSpecs();

  const handleChange = (e) => {
    const mediaType = e.target.value || null;
    const spec = mediaType ? getSpecByType(mediaType) : null;
    onChange(mediaType, spec ?? null);
  };

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
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      style={focused ? selectFocusedInlineStyle : selectInlineStyle}
    >
      <option value="">媒体種別を選択してください</option>
      {mediaSpecs.map((spec) => (
        <option key={spec.id} value={spec.media_type}>
          {spec.display_name}
        </option>
      ))}
    </select>
  );
}

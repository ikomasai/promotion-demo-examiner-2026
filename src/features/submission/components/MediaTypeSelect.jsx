/**
 * @fileoverview 媒体種別選択ドロップダウン
 * @module features/submission/components/MediaTypeSelect
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useMediaSpecs } from '../hooks/useMediaSpecs';

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
  const { mediaSpecs, loading, error, getSpecByType } = useMediaSpecs();

  const handleChange = (e) => {
    const mediaType = e.target.value || null;
    const spec = mediaType ? getSpecByType(mediaType) : null;
    onChange(mediaType, spec ?? null);
  };

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
      onChange={handleChange}
      disabled={disabled}
      style={styles.select}
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

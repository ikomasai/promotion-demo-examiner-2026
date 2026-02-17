/**
 * @fileoverview 高リスク提出理由入力
 * @description リスクスコア51%以上の場合に提出理由の入力を要求するコンポーネント。
 * @module features/submission/components/HighRiskReasonInput
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

/** 最低入力文字数 */
const MIN_LENGTH = 10;

/**
 * 高リスク時の理由入力
 * @param {{
 *   value: string,
 *   onChange: (text: string) => void,
 *   disabled: boolean
 * }} props
 */
export default function HighRiskReasonInput({ value, onChange, disabled }) {
  const charCount = value?.length ?? 0;
  const isValid = charCount >= MIN_LENGTH;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        高リスク判定のため、提出理由を入力してください
      </Text>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={value}
        onChangeText={onChange}
        placeholder="提出理由を入力（10文字以上）"
        placeholderTextColor="#666"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={!disabled}
      />
      <Text style={[styles.counter, isValid && styles.counterValid]}>
        {charCount}/{MIN_LENGTH}文字以上
      </Text>
    </View>
  );
}

/** 入力が有効かどうかを外部から参照できるようエクスポート */
HighRiskReasonInput.MIN_LENGTH = MIN_LENGTH;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    color: '#f44336',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#3d3d5c',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 100,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  counter: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 4,
  },
  counterValid: {
    color: '#4caf50',
  },
});

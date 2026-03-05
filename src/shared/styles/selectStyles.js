/**
 * @fileoverview ドロップダウン Select コンポーネント共通スタイル
 * @module shared/styles/selectStyles
 */

import { StyleSheet } from 'react-native';

/** React Native StyleSheet（loading, error 用） */
export const selectNativeStyles = StyleSheet.create({
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

/** HTML select のインラインスタイル（StyleSheet は DOM 要素に適用不可） */
export const selectInlineStyle = {
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

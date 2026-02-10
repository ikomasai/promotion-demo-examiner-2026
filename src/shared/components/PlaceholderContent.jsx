/**
 * @fileoverview プレースホルダーコンテンツ - 未実装画面表示
 * @description 開発中の画面に表示する仮コンテンツ。
 *              画面名と簡単な説明を表示。
 * @module shared/components/PlaceholderContent
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * プレースホルダーコンテンツ
 * @param {Object} props
 * @param {string} props.screenName - 画面名
 * @param {string} [props.description] - 画面の説明
 * @returns {React.ReactElement}
 */
export default function PlaceholderContent({ screenName, description }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{screenName}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      <Text style={styles.status}>この画面は開発中です</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  status: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
});

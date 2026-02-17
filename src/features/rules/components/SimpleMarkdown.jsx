/**
 * @fileoverview 軽量 Markdown レンダラー
 * @description seed データレベルの Markdown（##, -, 1., **）をレンダリング。
 *              外部ライブラリ不要。RuleDocumentCard と RuleEditModal で共用。
 * @module features/rules/components/SimpleMarkdown
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * インラインの **bold** を処理して Text 要素の配列を返す
 * @param {string} text
 * @param {string} key - React key prefix
 * @returns {React.ReactNode}
 */
function renderInline(text, key) {
  // **text** パターンで分割
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={`${key}-b${i}`} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part || null;
  });
}

/**
 * 1行をパースして種別と内容を返す
 * @param {string} line
 * @returns {{ type: string, content: string, number?: number }}
 */
function parseLine(line) {
  // 見出し: ## Heading
  const headingMatch = line.match(/^##\s+(.+)$/);
  if (headingMatch) {
    return { type: 'heading', content: headingMatch[1] };
  }

  // 番号付きリスト: 1. Item
  const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
  if (numberedMatch) {
    return { type: 'numbered', content: numberedMatch[2], number: parseInt(numberedMatch[1], 10) };
  }

  // 箇条書き: - Item
  const bulletMatch = line.match(/^-\s+(.+)$/);
  if (bulletMatch) {
    return { type: 'bullet', content: bulletMatch[1] };
  }

  // 空行
  if (line.trim() === '') {
    return { type: 'spacer', content: '' };
  }

  // 通常テキスト
  return { type: 'paragraph', content: line };
}

/**
 * 軽量 Markdown レンダラー
 * @param {{ content: string }} props
 */
export default function SimpleMarkdown({ content }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <View style={styles.container}>
      {lines.map((line, i) => {
        const parsed = parseLine(line);
        const key = `md-${i}`;

        switch (parsed.type) {
          case 'heading':
            return (
              <Text key={key} style={styles.heading}>
                {renderInline(parsed.content, key)}
              </Text>
            );

          case 'bullet':
            return (
              <View key={key} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>
                  {renderInline(parsed.content, key)}
                </Text>
              </View>
            );

          case 'numbered':
            return (
              <View key={key} style={styles.listItem}>
                <Text style={styles.number}>{parsed.number}.</Text>
                <Text style={styles.listText}>
                  {renderInline(parsed.content, key)}
                </Text>
              </View>
            );

          case 'spacer':
            return <View key={key} style={styles.spacer} />;

          case 'paragraph':
          default:
            return (
              <Text key={key} style={styles.paragraph}>
                {renderInline(parsed.content, key)}
              </Text>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 6,
  },
  listItem: {
    flexDirection: 'row',
    paddingLeft: 8,
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#4dabf7',
    lineHeight: 22,
  },
  number: {
    fontSize: 14,
    color: '#4dabf7',
    lineHeight: 22,
    minWidth: 20,
  },
  listText: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 22,
    flex: 1,
  },
  paragraph: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  spacer: {
    height: 8,
  },
});

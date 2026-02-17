/**
 * @fileoverview ルール文書カード
 * @description 文書1件を表示。document_type バッジ、バージョン、
 *              SimpleMarkdown による本文レンダリング、編集ボタン。
 * @module features/rules/components/RuleDocumentCard
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import SimpleMarkdown from './SimpleMarkdown';

/**
 * document_type → バッジ情報
 */
const TYPE_CONFIG = {
  josenai_rule: { bg: '#1e3525', text: '#4caf50', label: 'ルール' },
  copyright_guideline: { bg: '#3d3520', text: '#ff9800', label: '著作権' },
  submission_guide: { bg: '#1e2d44', text: '#4dabf7', label: '提出ガイド' },
};

/**
 * 日時を JST 表示用にフォーマット
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

/**
 * ルール文書カード
 * @param {{
 *   document: Object,
 *   onEdit: (document: Object) => void,
 *   canEdit: boolean
 * }} props
 */
export default function RuleDocumentCard({ document, onEdit, canEdit }) {
  const typeConfig = TYPE_CONFIG[document.document_type] || TYPE_CONFIG.josenai_rule;

  return (
    <View style={styles.card}>
      {/* ヘッダー: バッジ + バージョン */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: typeConfig.bg }]}>
          <Text style={[styles.badgeText, { color: typeConfig.text }]}>
            {typeConfig.label}
          </Text>
        </View>
        <Text style={styles.version}>v{document.version}</Text>
      </View>

      {/* タイトル */}
      <Text style={styles.title}>{document.title}</Text>

      {/* 更新日時 */}
      <Text style={styles.updatedAt}>
        最終更新: {formatDate(document.updated_at)}
      </Text>

      {/* 区切り線 */}
      <View style={styles.divider} />

      {/* Markdown 本文 */}
      <SimpleMarkdown content={document.content} />

      {/* 編集ボタン（審査者のみ） */}
      {canEdit && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(document)}
          >
            <Text style={styles.editText}>編集する</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  updatedAt: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#3d3d5c',
    marginVertical: 12,
  },
  editButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e2d44',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4dabf7',
  },
});

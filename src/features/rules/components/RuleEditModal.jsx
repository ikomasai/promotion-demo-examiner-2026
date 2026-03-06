/**
 * @fileoverview ルール文書編集モーダル
 * @description Markdown テキスト編集 + プレビュー切替。
 *              title/content 未変更時は保存ボタン disabled。
 * @module features/rules/components/RuleEditModal
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import { DOCUMENT_TYPE_CONFIG } from '../../../shared/constants/statusConfig';
import SimpleMarkdown from './SimpleMarkdown';

/**
 * ルール文書編集モーダル
 */
export default function RuleEditModal({ visible, document, onSave, onCancel, saving }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (visible && document) {
      setTitle(document.title || '');
      setContent(document.content || '');
      setShowPreview(false);
    }
  }, [visible, document]);

  const typeConfig = document
    ? (DOCUMENT_TYPE_CONFIG[document.document_type] || DOCUMENT_TYPE_CONFIG.josenai_rule)
    : DOCUMENT_TYPE_CONFIG.josenai_rule;

  const hasChanges = useMemo(() => {
    if (!document) return false;
    return title !== document.title || content !== document.content;
  }, [title, content, document]);

  const canSave = hasChanges && title.trim().length > 0 && !saving;

  if (!document) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>ルール文書の編集</Text>

            {/* バッジ + バージョン表示 */}
            <View style={styles.metaRow}>
              <Badge label={typeConfig.label} bg={typeConfig.bg} color={typeConfig.text} />
              <Text style={styles.versionText}>
                v{document.version} → v{document.version + 1}
              </Text>
            </View>

            {/* タイトル入力 */}
            <View style={styles.section}>
              <Text style={styles.label}>タイトル</Text>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="タイトルを入力..."
                placeholderTextColor={colors.text.disabled}
                editable={!saving}
              />
            </View>

            {/* 編集/プレビュー タブ */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, !showPreview && styles.tabActive]}
                onPress={() => setShowPreview(false)}
              >
                <Text style={[styles.tabText, !showPreview && styles.tabTextActive]}>編集</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, showPreview && styles.tabActive]}
                onPress={() => setShowPreview(true)}
              >
                <Text style={[styles.tabText, showPreview && styles.tabTextActive]}>プレビュー</Text>
              </TouchableOpacity>
            </View>

            {/* コンテンツエリア */}
            {showPreview ? (
              <View style={styles.previewBox}>
                <SimpleMarkdown content={content} />
              </View>
            ) : (
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="Markdown で本文を入力..."
                placeholderTextColor={colors.text.disabled}
                multiline
                editable={!saving}
                textAlignVertical="top"
              />
            )}
          </ScrollView>

          {/* アクションボタン */}
          <View style={styles.actions}>
            <Button variant="muted" onPress={onCancel} disabled={saving} style={styles.flex}>
              キャンセル
            </Button>
            <Button
              variant="primary"
              onPress={() => onSave(document.id, { title, content }, document.version)}
              disabled={!canSave}
              loading={saving}
              style={styles.flex}
            >
              保存する
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.bg.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: colors.bg.primary,
    borderRadius: radii.xl,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.heading4,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  versionText: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  titleInput: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text.secondary,
    ...typography.body,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    backgroundColor: colors.bg.elevated,
  },
  tabActive: {
    backgroundColor: colors.surfaceTint.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.muted,
  },
  tabTextActive: {
    color: colors.accent.primary,
  },
  contentInput: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text.secondary,
    ...typography.body,
    minHeight: 240,
    fontFamily: 'monospace',
  },
  previewBox: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    padding: 14,
    minHeight: 240,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xxl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  flex: {
    flex: 1,
  },
});

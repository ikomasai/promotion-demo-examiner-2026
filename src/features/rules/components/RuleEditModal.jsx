/**
 * @fileoverview ルール文書編集モーダル
 * @description Markdown テキスト編集 + プレビュー切替。
 *              ReviewModal のモーダルパターンを踏襲。
 *              title/content 未変更時は保存ボタン disabled。
 * @module features/rules/components/RuleEditModal
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
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
 * ルール文書編集モーダル
 * @param {{
 *   visible: boolean,
 *   document: Object|null,
 *   onSave: (id: string, updates: { title: string, content: string }, currentVersion: number) => Promise<void>,
 *   onCancel: () => void,
 *   saving: boolean
 * }} props
 */
export default function RuleEditModal({ visible, document, onSave, onCancel, saving }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // モーダルが開かれたら文書の値で初期化
  useEffect(() => {
    if (visible && document) {
      setTitle(document.title || '');
      setContent(document.content || '');
      setShowPreview(false);
    }
  }, [visible, document]);

  const typeConfig = document ? (TYPE_CONFIG[document.document_type] || TYPE_CONFIG.josenai_rule) : TYPE_CONFIG.josenai_rule;

  const hasChanges = useMemo(() => {
    if (!document) return false;
    return title !== document.title || content !== document.content;
  }, [title, content, document]);

  const canSave = hasChanges && title.trim().length > 0 && !saving;

  if (!document) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
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
              <View style={[styles.badge, { backgroundColor: typeConfig.bg }]}>
                <Text style={[styles.badgeText, { color: typeConfig.text }]}>
                  {typeConfig.label}
                </Text>
              </View>
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
                placeholderTextColor="#666"
                editable={!saving}
              />
            </View>

            {/* 編集/プレビュー タブ */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, !showPreview && styles.tabActive]}
                onPress={() => setShowPreview(false)}
              >
                <Text style={[styles.tabText, !showPreview && styles.tabTextActive]}>
                  編集
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, showPreview && styles.tabActive]}
                onPress={() => setShowPreview(true)}
              >
                <Text style={[styles.tabText, showPreview && styles.tabTextActive]}>
                  プレビュー
                </Text>
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
                placeholderTextColor="#666"
                multiline
                editable={!saving}
                textAlignVertical="top"
              />
            )}
          </ScrollView>

          {/* アクションボタン */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={saving}
            >
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, !canSave && styles.buttonDisabled]}
              onPress={() => onSave(document.id, { title, content }, document.version)}
              disabled={!canSave}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveText}>保存する</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  versionText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    padding: 14,
    color: '#e0e0e0',
    fontSize: 14,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2d2d44',
  },
  tabActive: {
    backgroundColor: '#1e2d44',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#4dabf7',
  },
  contentInput: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    padding: 14,
    color: '#e0e0e0',
    fontSize: 14,
    minHeight: 240,
    fontFamily: 'monospace',
  },
  previewBox: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    padding: 14,
    minHeight: 240,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#3d3d5c',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2d2d44',
  },
  cancelText: {
    color: '#a0a0a0',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4dabf7',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

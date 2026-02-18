/**
 * @fileoverview ルール管理画面 - 情宣ルール・ガイドライン
 * @description 情宣ルール・ガイドラインの閲覧と編集。
 *              Markdown 形式で管理し、バージョン履歴を保持。
 *              審査者（koho/kikaku/admin）のみ編集可能。
 * @module features/rules/screens/RuleListScreen
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import SkeletonCard from '../../../shared/components/SkeletonCard';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import RuleDocumentCard from '../components/RuleDocumentCard';
import RuleEditModal from '../components/RuleEditModal';
import { useRuleDocuments } from '../hooks/useRuleDocuments';
import { useAdmin } from '../../../shared/contexts/AdminContext';
import { useToast } from '../../../shared/contexts/ToastContext';

/**
 * ルール管理画面
 */
export default function RuleListScreen() {
  const { isMobile } = useResponsive();
  const { isReviewer } = useAdmin();
  const { showSuccess, showError } = useToast();
  const { documents, loading, error, refresh, updateDocument } = useRuleDocuments();

  // 編集モーダル状態
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * 編集ボタン → モーダル表示
   */
  const handleEdit = useCallback((document) => {
    setEditTarget(document);
  }, []);

  /**
   * 保存実行
   */
  const handleSave = useCallback(async (id, updates, currentVersion) => {
    setSaving(true);
    const result = await updateDocument(id, updates, currentVersion);
    setSaving(false);

    if (result.success) {
      showSuccess('ルール文書を更新しました');
      setEditTarget(null);
    } else {
      showError(result.error || '更新に失敗しました');
    }
  }, [updateDocument, showSuccess, showError]);

  /**
   * モーダルキャンセル
   */
  const handleCancel = useCallback(() => {
    setEditTarget(null);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
      refreshControl={
        <RefreshControl
          refreshing={loading && documents.length > 0}
          onRefresh={refresh}
          tintColor="#4dabf7"
        />
      }
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>ルール管理</Text>
        {documents.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{documents.length}件</Text>
          </View>
        )}
      </View>

      {/* エラーバナー */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ローディング（初回のみ） */}
      {loading && documents.length === 0 && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* 文書カードリスト */}
      {!loading && documents.length === 0 && !error && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>ルール文書がありません</Text>
        </View>
      )}

      {documents.map((doc) => (
        <RuleDocumentCard
          key={doc.id}
          document={doc}
          onEdit={handleEdit}
          canEdit={isReviewer}
        />
      ))}

      {/* 編集モーダル */}
      <RuleEditModal
        visible={!!editTarget}
        document={editTarget}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    paddingBottom: 40,
  },
  contentMobile: {
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  countBadge: {
    backgroundColor: '#1e2d44',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  countText: {
    fontSize: 13,
    color: '#4dabf7',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#3d2f1f',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  errorText: {
    color: '#ff9800',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
});

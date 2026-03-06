/**
 * @fileoverview 提出履歴画面 - 過去の提出一覧
 * @description 自分の提出履歴を確認できる画面。
 *              ステータス（審査中/承認/却下）と詳細を表示。
 *              pending 提出のみ削除可能。自動承認バッジ対応。
 * @module features/submission/screens/HistoryScreen
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors, spacing, typography, radii } from '../../../shared/theme';
import Banner from '../../../shared/components/Banner';
import Badge from '../../../shared/components/Badge';
import SkeletonCard from '../../../shared/components/SkeletonCard';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import SubmissionCard from '../components/SubmissionCard';
import SubmissionDetailModal from '../components/SubmissionDetailModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useSubmissionHistory } from '../hooks/useSubmissionHistory';
import { useSubmissionDelete } from '../hooks/useSubmissionDelete';
import { useToast } from '../../../shared/contexts/ToastContext';

/**
 * 提出履歴画面
 */
export default function HistoryScreen() {
  const { isMobile } = useResponsive();
  const { submissions, loading, error, refresh } = useSubmissionHistory();
  const { deleting, deleteSubmission } = useSubmissionDelete();
  const { showSuccess, showError } = useToast();

  /** 詳細モーダル表示用 */
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  /** 削除確認モーダル表示用 */
  const [deleteTarget, setDeleteTarget] = useState(null);

  /**
   * カードタップ → 詳細モーダル
   */
  const handleCardPress = useCallback((submission) => {
    setSelectedSubmission(submission);
  }, []);

  /**
   * 削除ボタン → 削除確認モーダル
   */
  const handleDeletePress = useCallback((submission) => {
    setDeleteTarget(submission);
  }, []);

  /**
   * 削除実行
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    const success = await deleteSubmission(deleteTarget.id, deleteTarget.drive_file_id);

    if (success) {
      showSuccess('提出を削除しました');
      setDeleteTarget(null);
      refresh();
    } else {
      showError('削除に失敗しました');
    }
  }, [deleteTarget, deleteSubmission, showSuccess, showError, refresh]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
      refreshControl={
        <RefreshControl
          refreshing={loading && submissions.length > 0}
          onRefresh={refresh}
          tintColor={colors.accent.primary}
        />
      }
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>提出履歴</Text>
        {submissions.length > 0 && (
          <Badge
            label={`${submissions.length}件`}
            bg={colors.bg.elevated}
            color={colors.accent.primary}
            size="md"
          />
        )}
      </View>

      {/* エラーバナー */}
      {error && (
        <Banner variant="error" style={styles.errorBanner}>
          {error}
        </Banner>
      )}

      {/* ローディング（初回のみ） */}
      {loading && submissions.length === 0 && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* 空状態 */}
      {!loading && !error && submissions.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>提出履歴がありません</Text>
          <Text style={styles.emptyDescription}>
            事前チェックまたは正式提出画面から提出を行うと、{'\n'}
            ここに履歴が表示されます。
          </Text>
        </View>
      )}

      {/* 提出カードリスト */}
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          onPress={handleCardPress}
          onDelete={handleDeletePress}
        />
      ))}

      {/* 詳細モーダル */}
      <SubmissionDetailModal
        visible={!!selectedSubmission}
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        visible={!!deleteTarget}
        submission={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    paddingBottom: 40,
  },
  contentMobile: {
    paddingHorizontal: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heading3,
    color: colors.text.primary,
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.heading4,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});

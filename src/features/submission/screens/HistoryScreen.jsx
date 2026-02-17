/**
 * @fileoverview 提出履歴画面 - 過去の提出一覧
 * @description 自分の提出履歴を確認できる画面。
 *              ステータス（審査中/承認/却下）と詳細を表示。
 *              pending 提出のみ削除可能。自動承認バッジ対応。
 * @module features/submission/screens/HistoryScreen
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
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

    const success = await deleteSubmission(
      deleteTarget.id,
      deleteTarget.drive_file_id,
    );

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
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading && submissions.length > 0}
          onRefresh={refresh}
          tintColor="#4dabf7"
        />
      }
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>提出履歴</Text>
        {submissions.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{submissions.length}件</Text>
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
      {loading && submissions.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4dabf7" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      )}

      {/* 空状態 */}
      {!loading && !error && submissions.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>提出履歴がありません</Text>
          <Text style={styles.emptyDescription}>
            サンドボックスまたは正式提出画面から提出を行うと、{'\n'}
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
    backgroundColor: '#1a1a2e',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  countBadge: {
    backgroundColor: '#2d2d44',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
});

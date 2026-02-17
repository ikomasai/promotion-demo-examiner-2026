/**
 * @fileoverview ダッシュボード画面 - 管理者審査機能
 * @description 担当範囲の提出一覧表示と審査機能。
 *              koho は広報部提出、kikaku は企画管理部提出、admin は全て審査可能。
 *              RLS が自動でロールベースフィルタリングを適用。
 * @module features/review/screens/DashboardScreen
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import SubmissionTable from '../components/SubmissionTable';
import ReviewModal from '../components/ReviewModal';
import DashboardFilters from '../components/DashboardFilters';
import SubmissionDetailModal from '../../submission/components/SubmissionDetailModal';
import { useReviewSubmissions } from '../hooks/useReviewSubmissions';
import { useReview } from '../hooks/useReview';
import { useAdmin } from '../../../shared/contexts/AdminContext';
import { useToast } from '../../../shared/contexts/ToastContext';

/**
 * ダッシュボード画面
 */
export default function DashboardScreen() {
  const { isAdmin, isKohoReviewer, isKikakuReviewer } = useAdmin();
  const { showSuccess, showError } = useToast();

  // フィルタ状態
  const [filters, setFilters] = useState({
    status: 'pending',
    submissionType: isAdmin ? null : null,
    autoApproveFilter: null,
  });

  // データ取得
  const { submissions, loading, error, stats, refresh } = useReviewSubmissions(filters);

  // 審査アクション
  const { reviewing, error: reviewError, versionConflict, review, clearError } = useReview();

  // モーダル状態
  const [reviewTarget, setReviewTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);

  /**
   * 「審査する」ボタン → ReviewModal
   */
  const handleReviewPress = useCallback((submission) => {
    clearError();
    setReviewTarget(submission);
  }, [clearError]);

  /**
   * カードタップ → SubmissionDetailModal
   */
  const handleDetailPress = useCallback((submission) => {
    setDetailTarget(submission);
  }, []);

  /**
   * 承認実行
   */
  const handleApprove = useCallback(async (comment) => {
    if (!reviewTarget) return;

    const success = await review(
      reviewTarget.id,
      'approve',
      comment,
      reviewTarget.version,
    );

    if (success) {
      showSuccess('承認しました');
      setReviewTarget(null);
      refresh();
    } else {
      // versionConflict は useReview が管理 — 自動 refresh で最新化
    }
  }, [reviewTarget, review, showSuccess, refresh]);

  /**
   * 却下実行
   */
  const handleReject = useCallback(async (comment) => {
    if (!reviewTarget) return;

    const success = await review(
      reviewTarget.id,
      'reject',
      comment,
      reviewTarget.version,
    );

    if (success) {
      showSuccess('却下しました');
      setReviewTarget(null);
      refresh();
    }
  }, [reviewTarget, review, showSuccess, refresh]);

  /**
   * バージョンコンフリクト時の自動リフレッシュ
   */
  const handleReviewCancel = useCallback(() => {
    if (versionConflict) {
      refresh();
    }
    clearError();
    setReviewTarget(null);
  }, [versionConflict, refresh, clearError]);

  /** 未審査件数 */
  const pendingCount = stats.pending;

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
        <Text style={styles.title}>審査ダッシュボード</Text>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>未審査 {pendingCount}件</Text>
          </View>
        )}
      </View>

      {/* フィルタ */}
      <DashboardFilters
        filters={filters}
        onFiltersChange={setFilters}
        stats={stats}
        isAdmin={isAdmin}
      />

      {/* エラーバナー */}
      {(error || reviewError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error || reviewError}</Text>
        </View>
      )}

      {/* バージョンコンフリクト警告 */}
      {versionConflict && (
        <View style={styles.conflictBanner}>
          <Text style={styles.conflictText}>
            他の審査者が先に審査しました。一覧を更新しています...
          </Text>
        </View>
      )}

      {/* ローディング（初回のみ） */}
      {loading && submissions.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4dabf7" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      )}

      {/* 提出カードリスト */}
      {!loading && (
        <SubmissionTable
          submissions={submissions}
          onReview={handleReviewPress}
          onDetail={handleDetailPress}
          emptyMessage={
            filters.status === 'pending'
              ? '未審査の提出はありません'
              : '該当する提出がありません'
          }
        />
      )}

      {/* 審査モーダル */}
      <ReviewModal
        visible={!!reviewTarget}
        submission={reviewTarget}
        onApprove={handleApprove}
        onReject={handleReject}
        onCancel={handleReviewCancel}
        reviewing={reviewing}
      />

      {/* 詳細モーダル */}
      <SubmissionDetailModal
        visible={!!detailTarget}
        submission={detailTarget}
        onClose={() => setDetailTarget(null)}
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  pendingBadge: {
    backgroundColor: '#3d3520',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  pendingText: {
    fontSize: 13,
    color: '#ff9800',
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
  conflictBanner: {
    backgroundColor: '#1e2d44',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  conflictText: {
    color: '#4dabf7',
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
});

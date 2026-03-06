/**
 * @fileoverview ダッシュボード画面 - 管理者審査機能
 * @description 担当範囲の提出一覧表示と審査機能。
 *              koho は広報部提出、kikaku は企画管理部提出、admin は全て審査可能。
 *              RLS が自動でロールベースフィルタリングを適用。
 * @module features/review/screens/DashboardScreen
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors, spacing, typography } from '../../../shared/theme';
import Badge from '../../../shared/components/Badge';
import Banner from '../../../shared/components/Banner';
import SkeletonCard from '../../../shared/components/SkeletonCard';
import { useResponsive } from '../../../shared/hooks/useResponsive';
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
  const { isMobile } = useResponsive();
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

  const handleReviewPress = useCallback((submission) => {
    clearError();
    setReviewTarget(submission);
  }, [clearError]);

  const handleDetailPress = useCallback((submission) => {
    setDetailTarget(submission);
  }, []);

  const handleApprove = useCallback(async (comment) => {
    if (!reviewTarget) return;
    const success = await review(reviewTarget.id, 'approve', comment, reviewTarget.version);
    if (success) {
      showSuccess('承認しました');
      setReviewTarget(null);
      refresh();
    }
  }, [reviewTarget, review, showSuccess, refresh]);

  const handleReject = useCallback(async (comment) => {
    if (!reviewTarget) return;
    const success = await review(reviewTarget.id, 'reject', comment, reviewTarget.version);
    if (success) {
      showSuccess('却下しました');
      setReviewTarget(null);
      refresh();
    }
  }, [reviewTarget, review, showSuccess, refresh]);

  const handleReviewCancel = useCallback(() => {
    if (versionConflict) {
      refresh();
    }
    clearError();
    setReviewTarget(null);
  }, [versionConflict, refresh, clearError]);

  const pendingCount = stats.pending;

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
        <Text style={styles.title}>審査ダッシュボード</Text>
        {pendingCount > 0 && (
          <Badge
            label={`未審査 ${pendingCount}件`}
            bg={colors.surfaceTint.warning}
            color={colors.accent.warning}
            size="md"
            style={{ borderWidth: 1, borderColor: colors.accent.warning }}
          />
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
        <Banner variant="error" style={styles.banner}>
          {error || reviewError}
        </Banner>
      )}

      {/* バージョンコンフリクト警告 */}
      {versionConflict && (
        <Banner variant="info" style={styles.banner}>
          他の審査者が先に審査しました。一覧を更新しています...
        </Banner>
      )}

      {/* ローディング（初回のみ） */}
      {loading && submissions.length === 0 && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
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
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.heading3,
    color: colors.text.primary,
  },
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
});

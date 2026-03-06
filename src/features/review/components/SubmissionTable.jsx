/**
 * @fileoverview 審査者向け提出カードリスト
 * @description 審査ダッシュボード用の提出一覧。StatusBadge を再利用し、
 *              提出先バッジ・自動承認バッジ・「審査する」ボタンを含む。
 * @module features/review/components/SubmissionTable
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { SUBMISSION_TYPE_CONFIG } from '../../../shared/constants/statusConfig';
import { formatDateJST } from '../../../shared/utils/dateFormat';
import StatusBadge from '../../submission/components/StatusBadge';

/**
 * リスクスコアの色
 */
function getScoreColor(score) {
  if (score === null || score === undefined) return colors.text.tertiary;
  if (score <= 10) return colors.accent.success;
  if (score <= 50) return colors.accent.warning;
  return colors.accent.danger;
}

/**
 * 自動承認かどうかを判定
 */
function isAutoApproved(submission) {
  return submission.reviewed_by === null && submission.status === 'approved';
}

/**
 * 審査カード（1件分）
 */
function ReviewCard({ submission, onReview, onDetail }) {
  const { isMobile } = useResponsive();
  const orgName = submission.organization?.organization_name || '不明';
  const projName = submission.project?.project_name || '不明';
  const typeConfig = SUBMISSION_TYPE_CONFIG[submission.submission_type] || SUBMISSION_TYPE_CONFIG.koho;
  const canReview = submission.status === 'pending';
  const autoApproved = isAutoApproved(submission);

  return (
    <TouchableOpacity
      style={[styles.card, isMobile && styles.cardMobile]}
      onPress={() => onDetail(submission)}
      activeOpacity={0.7}
    >
      {/* Row 1: ステータス + 自動承認 + 提出先 */}
      <View style={styles.badgeRow}>
        <StatusBadge status={submission.status} />
        {autoApproved && (
          <Badge label="自動承認" bg={colors.surfaceTint.teal} color={colors.accent.teal} />
        )}
        <Badge label={typeConfig.label} bg={typeConfig.bg} color={typeConfig.text} />
      </View>

      {/* Row 2: ファイル名 */}
      <Text style={styles.fileName} numberOfLines={1}>
        {submission.file_name}
      </Text>

      {/* Row 3: 団体 > 企画 | メディアタイプ */}
      <Text style={styles.meta} numberOfLines={1}>
        {orgName} › {projName}　|　{submission.media_type}
      </Text>

      {/* Row 4: 日時 + リスクスコア + 審査ボタン */}
      <View style={styles.bottomRow}>
        <View style={styles.bottomLeft}>
          <Text style={styles.dateText}>{formatDateJST(submission.created_at)}</Text>
          {submission.ai_risk_score !== null && submission.ai_risk_score !== undefined && (
            <View style={[styles.scoreBadge, { borderColor: getScoreColor(submission.ai_risk_score) }]}>
              <Text style={[styles.scoreText, { color: getScoreColor(submission.ai_risk_score) }]}>
                リスク {submission.ai_risk_score}%
              </Text>
            </View>
          )}
        </View>

        {canReview && (
          <Button
            variant="outline"
            size="sm"
            onPress={(e) => {
              e?.stopPropagation?.();
              onReview(submission);
            }}
            style={styles.reviewButton}
          >
            審査する
          </Button>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * 提出カードリスト（審査者向け）
 */
export default function SubmissionTable({ submissions, onReview, onDetail, emptyMessage }) {
  if (submissions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{emptyMessage || '該当する提出がありません'}</Text>
      </View>
    );
  }

  return (
    <View>
      {submissions.map((submission) => (
        <ReviewCard
          key={submission.id}
          submission={submission}
          onReview={onReview}
          onDetail={onDetail}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  cardMobile: {
    padding: spacing.md,
    marginHorizontal: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: '#b0b0c8',
    marginBottom: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  dateText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  scoreBadge: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  scoreText: {
    ...typography.small,
  },
  reviewButton: {
    backgroundColor: colors.surfaceTint.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.bodyLarge,
    color: colors.text.muted,
    textAlign: 'center',
  },
});

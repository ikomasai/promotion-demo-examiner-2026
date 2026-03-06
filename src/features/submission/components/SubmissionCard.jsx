/**
 * @fileoverview 提出カードコンポーネント
 * @description 提出履歴一覧のカード UI。ステータスバッジ、自動承認ラベル、
 *              ファイル情報、リスクスコア小表示、削除ボタン（pending のみ）を含む。
 * @module features/submission/components/SubmissionCard
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Badge from '../../../shared/components/Badge';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { formatDateJST } from '../../../shared/utils/dateFormat';
import StatusBadge from './StatusBadge';

/** submission_type の表示ラベル */
const TYPE_LABELS = {
  koho: '広報部提出',
  kikaku: '企画部提出',
};

/**
 * ファイルサイズを人間可読形式に変換
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * リスクスコアのミニバッジ色
 * @param {number|null} score
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
 * 提出カード
 * @param {{
 *   submission: Object,
 *   onPress: (submission: Object) => void,
 *   onDelete: (submission: Object) => void
 * }} props
 */
export default React.memo(function SubmissionCard({ submission, onPress, onDelete }) {
  const { isMobile } = useResponsive();
  const orgName = submission.organization?.organization_name || '不明';
  const projName = submission.project?.project_name || '不明';
  const canDelete = submission.status === 'pending';
  const autoApproved = isAutoApproved(submission);

  return (
    <TouchableOpacity
      style={[styles.card, isMobile && styles.cardMobile]}
      onPress={() => onPress(submission)}
      activeOpacity={0.7}
    >
      {/* Row 1: ステータス + 自動承認バッジ */}
      <View style={styles.badgeRow}>
        <StatusBadge status={submission.status} />
        {autoApproved && (
          <Badge label="自動承認" bg={colors.surfaceTint.teal} color={colors.accent.teal} />
        )}
      </View>

      {/* Row 2: ファイル名 */}
      <Text style={styles.fileName} numberOfLines={1}>
        {submission.file_name}
      </Text>

      {/* Row 3: 団体 > 企画 | メディアタイプ */}
      <Text style={styles.meta} numberOfLines={1}>
        {orgName} › {projName}　|　{submission.media_type}
      </Text>

      {/* Row 4: 提出先 + 日時 */}
      <Text style={styles.subMeta}>
        {TYPE_LABELS[submission.submission_type] || submission.submission_type}
        {'　'}
        {formatDateJST(submission.created_at)}
      </Text>

      {/* Row 5: リスクスコア + 削除ボタン */}
      <View style={styles.bottomRow}>
        <View style={styles.scoreArea}>
          {submission.ai_risk_score !== null && submission.ai_risk_score !== undefined ? (
            <View style={[styles.scoreBadge, { borderColor: getScoreColor(submission.ai_risk_score) }]}>
              <Text style={[styles.scoreText, { color: getScoreColor(submission.ai_risk_score) }]}>
                リスク {submission.ai_risk_score}%
              </Text>
            </View>
          ) : (
            <View style={[styles.scoreBadge, { borderColor: colors.text.tertiary }]}>
              <Text style={[styles.scoreText, { color: colors.text.tertiary }]}>AI判定なし</Text>
            </View>
          )}
          {submission.file_size_bytes > 0 && (
            <Text style={styles.fileSize}>{formatFileSize(submission.file_size_bytes)}</Text>
          )}
        </View>

        {canDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete(submission);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteText}>削除</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

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
    marginBottom: spacing.xs,
  },
  subMeta: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  fileSize: {
    ...typography.small,
    fontWeight: '400',
    color: colors.text.muted,
  },
  deleteButton: {
    backgroundColor: colors.surfaceTint.danger,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
  },
  deleteText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.accent.danger,
  },
});

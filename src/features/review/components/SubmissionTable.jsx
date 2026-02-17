/**
 * @fileoverview 審査者向け提出カードリスト
 * @description 審査ダッシュボード用の提出一覧。StatusBadge を再利用し、
 *              提出先バッジ・自動承認バッジ・「審査する」ボタンを含む。
 * @module features/review/components/SubmissionTable
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import StatusBadge from '../../submission/components/StatusBadge';

/** 提出先バッジの設定 */
const TYPE_CONFIG = {
  koho: { bg: '#1e2d44', text: '#4dabf7', label: '広報部' },
  kikaku: { bg: '#2d1e44', text: '#ab47bc', label: '企画管理部' },
};

/**
 * UTC → JST 表示
 */
function formatDateJST(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

/**
 * リスクスコアの色
 */
function getScoreColor(score) {
  if (score === null || score === undefined) return '#a0a0a0';
  if (score <= 10) return '#4caf50';
  if (score <= 50) return '#ff9800';
  return '#f44336';
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
  const orgName = submission.organization?.organization_name || '不明';
  const projName = submission.project?.project_name || '不明';
  const typeConfig = TYPE_CONFIG[submission.submission_type] || TYPE_CONFIG.koho;
  const canReview = submission.status === 'pending';
  const autoApproved = isAutoApproved(submission);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onDetail(submission)}
      activeOpacity={0.7}
    >
      {/* Row 1: ステータス + 自動承認 + 提出先 */}
      <View style={styles.badgeRow}>
        <StatusBadge status={submission.status} />
        {autoApproved && (
          <View style={styles.autoApproveBadge}>
            <Text style={styles.autoApproveText}>自動承認</Text>
          </View>
        )}
        <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
          <Text style={[styles.typeText, { color: typeConfig.text }]}>
            {typeConfig.label}
          </Text>
        </View>
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
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={(e) => {
              e.stopPropagation?.();
              onReview(submission);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.reviewButtonText}>審査する</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * 提出カードリスト（審査者向け）
 * @param {{
 *   submissions: Array,
 *   onReview: (submission: Object) => void,
 *   onDetail: (submission: Object) => void,
 *   emptyMessage?: string
 * }} props
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
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  autoApproveBadge: {
    backgroundColor: '#1e3535',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  autoApproveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#26a69a',
  },
  typeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: '#b0b0c8',
    marginBottom: 12,
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
    fontSize: 12,
    color: '#888',
  },
  scoreBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#1e2d44',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4dabf7',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

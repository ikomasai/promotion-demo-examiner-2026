/**
 * @fileoverview 提出カードコンポーネント
 * @description 提出履歴一覧のカード UI。ステータスバッジ、自動承認ラベル、
 *              ファイル情報、リスクスコア小表示、削除ボタン（pending のみ）を含む。
 * @module features/submission/components/SubmissionCard
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
 * UTC 日時を JST 表示用にフォーマット
 * @param {string} isoString
 * @returns {string}
 */
function formatDateJST(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

/**
 * リスクスコアのミニバッジ色
 * @param {number|null} score
 */
function getScoreColor(score) {
  if (score === null || score === undefined) return '#a0a0a0';
  if (score <= 10) return '#4caf50';
  if (score <= 50) return '#ff9800';
  return '#f44336';
}

/**
 * 自動承認かどうかを判定
 * @param {{ reviewed_by: string|null, status: string }} submission
 * @returns {boolean}
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
export default function SubmissionCard({ submission, onPress, onDelete }) {
  const orgName = submission.organization?.organization_name || '不明';
  const projName = submission.project?.project_name || '不明';
  const canDelete = submission.status === 'pending';
  const autoApproved = isAutoApproved(submission);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(submission)}
      activeOpacity={0.7}
    >
      {/* Row 1: ステータス + 自動承認バッジ */}
      <View style={styles.badgeRow}>
        <StatusBadge status={submission.status} />
        {autoApproved && (
          <View style={styles.autoApproveBadge}>
            <Text style={styles.autoApproveText}>自動承認</Text>
          </View>
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
            <View style={[styles.scoreBadge, { borderColor: '#a0a0a0' }]}>
              <Text style={[styles.scoreText, { color: '#a0a0a0' }]}>AI判定なし</Text>
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
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: '#b0b0c8',
    marginBottom: 4,
  },
  subMeta: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
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
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 11,
    color: '#888',
  },
  deleteButton: {
    backgroundColor: '#3d1e1e',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f44336',
  },
});

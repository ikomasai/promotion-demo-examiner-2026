/**
 * @fileoverview 提出詳細モーダル
 * @description 提出の全詳細を表示するモーダル。RiskScoreDisplay を再利用。
 *              Drive リンク、コメント、自動承認免責を含む。
 * @module features/submission/components/SubmissionDetailModal
 */

import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import StatusBadge from './StatusBadge';
import RiskScoreDisplay from './RiskScoreDisplay';

/** submission_type の表示ラベル */
const TYPE_LABELS = {
  koho: '広報部提出',
  kikaku: '企画部提出',
};

/**
 * ファイルサイズを人間可読形式に変換
 */
function formatFileSize(bytes) {
  if (!bytes) return '不明';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * UTC → JST 表示
 */
function formatDateJST(isoString) {
  if (!isoString) return '不明';
  return new Date(isoString).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

/**
 * 自動承認判定
 */
function isAutoApproved(submission) {
  return submission.reviewed_by === null && submission.status === 'approved';
}

/**
 * メタデータ行
 */
function MetaRow({ label, value }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

/**
 * 提出詳細モーダル
 * @param {{
 *   visible: boolean,
 *   submission: Object|null,
 *   onClose: () => void
 * }} props
 */
export default function SubmissionDetailModal({ visible, submission, onClose }) {
  if (!submission) return null;

  const orgName = submission.organization?.organization_name || '不明';
  const projName = submission.project?.project_name || '不明';
  const autoApproved = isAutoApproved(submission);

  const riskResult = {
    ai_risk_score: submission.ai_risk_score,
    ai_risk_details: submission.ai_risk_details,
    skipped: submission.ai_risk_score === null,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ヘッダー: ファイル名 + ステータス */}
            <Text style={styles.title} numberOfLines={2}>
              {submission.file_name}
            </Text>
            <View style={styles.badgeRow}>
              <StatusBadge status={submission.status} />
              {autoApproved && (
                <View style={styles.autoApproveBadge}>
                  <Text style={styles.autoApproveText}>自動承認</Text>
                </View>
              )}
            </View>

            {/* メタデータ */}
            <View style={styles.metaSection}>
              <MetaRow label="団体" value={orgName} />
              <MetaRow label="企画" value={projName} />
              <MetaRow label="提出先" value={TYPE_LABELS[submission.submission_type] || submission.submission_type} />
              <MetaRow label="メディアタイプ" value={submission.media_type} />
              <MetaRow label="ファイルサイズ" value={formatFileSize(submission.file_size_bytes)} />
              <MetaRow label="提出日時" value={formatDateJST(submission.created_at)} />
              {submission.reviewed_at && (
                <MetaRow label="審査日時" value={formatDateJST(submission.reviewed_at)} />
              )}
            </View>

            {/* AI リスクスコア */}
            <View style={styles.riskSection}>
              <Text style={styles.sectionTitle}>AI リスク判定</Text>
              <RiskScoreDisplay
                result={riskResult}
                actions={<></>}
              />
            </View>

            {/* コメント */}
            {submission.user_comment && (
              <View style={styles.commentSection}>
                <Text style={styles.sectionTitle}>提出者コメント</Text>
                <Text style={styles.commentText}>{submission.user_comment}</Text>
              </View>
            )}
            {submission.reviewer_comment && (
              <View style={styles.commentSection}>
                <Text style={styles.sectionTitle}>審査者コメント</Text>
                <Text style={styles.commentText}>{submission.reviewer_comment}</Text>
              </View>
            )}

            {/* Drive リンク */}
            {submission.drive_file_url && (
              <TouchableOpacity
                style={styles.driveButton}
                onPress={() => Linking.openURL(submission.drive_file_url)}
              >
                <Text style={styles.driveButtonText}>Google Drive で開く</Text>
              </TouchableOpacity>
            )}

            {/* 自動承認免責 */}
            {autoApproved && (
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                  この提出は AI 判定の結果、低リスクと判定されたため自動承認されました。
                  人間による審査は行われていません。
                </Text>
              </View>
            )}
          </ScrollView>

          {/* 閉じるボタン */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>閉じる</Text>
          </TouchableOpacity>
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
    maxWidth: 480,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
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
  metaSection: {
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: '#888',
  },
  metaValue: {
    fontSize: 13,
    color: '#e0e0e0',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '60%',
  },
  riskSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  commentSection: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  commentText: {
    fontSize: 13,
    color: '#e0e0e0',
    lineHeight: 20,
  },
  driveButton: {
    backgroundColor: '#2d2d44',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  driveButtonText: {
    color: '#4dabf7',
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimerBox: {
    backgroundColor: '#1e3535',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#26a69a44',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#26a69a',
    lineHeight: 18,
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3d3d5c',
  },
  closeText: {
    color: '#a0a0a0',
    fontSize: 14,
    fontWeight: '600',
  },
});

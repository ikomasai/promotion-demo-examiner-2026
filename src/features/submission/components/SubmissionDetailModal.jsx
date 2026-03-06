/**
 * @fileoverview 提出詳細モーダル
 * @description 提出の全詳細を表示するモーダル。RiskScoreDisplay を再利用。
 *              Drive リンク、コメント、自動承認免責を含む。
 * @module features/submission/components/SubmissionDetailModal
 */

import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import { formatDateJST } from '../../../shared/utils/dateFormat';
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                <Badge label="自動承認" bg={colors.surfaceTint.teal} color={colors.accent.teal} />
              )}
            </View>

            {/* メタデータ */}
            <View style={styles.metaSection}>
              <MetaRow label="団体" value={orgName} />
              <MetaRow label="企画" value={projName} />
              <MetaRow
                label="提出先"
                value={TYPE_LABELS[submission.submission_type] || submission.submission_type}
              />
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
              <RiskScoreDisplay result={riskResult} actions={<></>} />
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
              <Button
                variant="outline"
                onPress={() => Linking.openURL(submission.drive_file_url)}
                style={styles.linkButton}
              >
                Google Drive で開く
              </Button>
            )}

            {/* AI 判定レポート */}
            {submission.docs_file_url && (
              <Button
                variant="outline"
                onPress={() => Linking.openURL(submission.docs_file_url)}
                style={[styles.linkButton, { borderColor: colors.accent.google }]}
              >
                AI判定レポートを開く
              </Button>
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
          <Button
            variant="outline-muted"
            onPress={onClose}
            style={styles.closeButton}
          >
            閉じる
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.bg.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: colors.bg.primary,
    borderRadius: radii.xl,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.heading4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metaSection: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: colors.text.muted,
  },
  metaValue: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '60%',
  },
  riskSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  commentSection: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: spacing.md,
  },
  commentText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  linkButton: {
    marginBottom: spacing.md,
  },
  disclaimerBox: {
    backgroundColor: colors.surfaceTint.teal,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#26a69a44',
  },
  disclaimerText: {
    ...typography.small,
    fontWeight: '400',
    color: colors.accent.teal,
    lineHeight: 18,
    textAlign: 'center',
  },
  closeButton: {
    margin: spacing.lg,
    borderTopWidth: 0,
  },
});

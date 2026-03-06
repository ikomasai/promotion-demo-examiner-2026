/**
 * @fileoverview 審査モーダル — 承認/却下アクション
 * @description 提出の審査を実行するモーダル。AI リスクスコア概要、
 *              指摘事項サマリー、コメント入力を含む。
 *              却下時はコメント必須、承認時は任意。
 * @module features/review/components/ReviewModal
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Linking,
} from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Button from '../../../shared/components/Button';

/**
 * リスクスコアの色とラベル
 */
function getRiskInfo(score) {
  if (score === null || score === undefined)
    return { color: colors.text.tertiary, label: '判定なし', bg: colors.bg.elevated };
  if (score <= 10) return { color: colors.accent.success, label: '低リスク', bg: colors.surfaceTint.success };
  if (score <= 50) return { color: colors.accent.warning, label: '中リスク', bg: colors.surfaceTint.warning };
  return { color: colors.accent.danger, label: '高リスク', bg: colors.surfaceTint.danger };
}

/**
 * AI 指摘事項から flagged items を抽出
 */
function extractFlaggedItems(riskDetails) {
  if (!riskDetails || !Array.isArray(riskDetails.items)) return [];
  return riskDetails.items.filter((item) => item.flagged).slice(0, 5);
}

/**
 * 審査モーダル
 * @param {{
 *   visible: boolean,
 *   submission: Object|null,
 *   onApprove: (comment: string|null) => void,
 *   onReject: (comment: string) => void,
 *   onCancel: () => void,
 *   reviewing: boolean
 * }} props
 */
export default function ReviewModal({
  visible,
  submission,
  onApprove,
  onReject,
  onCancel,
  reviewing,
}) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (visible) {
      setComment('');
    }
  }, [visible]);

  const riskInfo = useMemo(
    () => getRiskInfo(submission?.ai_risk_score),
    [submission?.ai_risk_score],
  );

  const flaggedItems = useMemo(
    () => extractFlaggedItems(submission?.ai_risk_details),
    [submission?.ai_risk_details],
  );

  const canReject = comment.trim().length > 0;

  if (!submission) return null;

  const orgName = submission.organization?.organization_name || '不明';
  const projName = submission.project?.project_name || '不明';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>提出物の審査</Text>

            {/* ファイル情報 */}
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={2}>
                {submission.file_name}
              </Text>
              <Text style={styles.fileMeta}>
                {orgName} › {projName}
              </Text>
            </View>

            {/* AI 判定レポート */}
            {submission.docs_file_url && (
              <Button
                variant="outline"
                size="sm"
                onPress={() => Linking.openURL(submission.docs_file_url)}
                style={[styles.docsLink, { borderColor: colors.accent.google }]}
              >
                AI判定レポートを開く
              </Button>
            )}

            {/* AI リスクスコア */}
            <View style={[styles.riskBox, { backgroundColor: riskInfo.bg }]}>
              <View style={styles.riskHeader}>
                <Text style={[styles.riskLabel, { color: riskInfo.color }]}>{riskInfo.label}</Text>
                {submission.ai_risk_score !== null && submission.ai_risk_score !== undefined && (
                  <Text style={[styles.riskScore, { color: riskInfo.color }]}>
                    {submission.ai_risk_score}%
                  </Text>
                )}
              </View>
            </View>

            {/* 指摘事項サマリー */}
            {flaggedItems.length > 0 && (
              <View style={styles.flaggedSection}>
                <Text style={styles.flaggedTitle}>AI 指摘事項</Text>
                {flaggedItems.map((item, i) => (
                  <View key={i} style={styles.flaggedItem}>
                    <Text style={styles.flaggedBullet}>!</Text>
                    <View style={styles.flaggedContent}>
                      <Text style={styles.flaggedName}>{item.name}</Text>
                      {item.comment && <Text style={styles.flaggedComment}>{item.comment}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 審査コメント */}
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>
                審査コメント
                <Text style={styles.commentHint}> (却下時は必須)</Text>
              </Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="コメントを入力..."
                placeholderTextColor={colors.text.disabled}
                multiline
                numberOfLines={3}
                editable={!reviewing}
              />
            </View>
          </ScrollView>

          {/* アクションボタン */}
          <View style={styles.actions}>
            <Button
              variant="danger"
              onPress={() => onReject(comment.trim())}
              disabled={!canReject || reviewing}
              loading={reviewing}
              style={styles.flex}
            >
              却下する
            </Button>
            <Button
              variant="success"
              onPress={() => onApprove(comment.trim() || null)}
              disabled={reviewing}
              loading={reviewing}
              style={styles.flex}
            >
              承認する
            </Button>
          </View>

          {/* キャンセル */}
          <Button
            variant="outline-muted"
            onPress={onCancel}
            disabled={reviewing}
            style={styles.cancelButton}
          >
            キャンセル
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
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  fileInfo: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: spacing.md,
  },
  fileName: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  fileMeta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  docsLink: {
    marginBottom: spacing.md,
  },
  riskBox: {
    borderRadius: radii.md,
    padding: 14,
    marginBottom: spacing.md,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    ...typography.label,
    fontWeight: '700',
  },
  riskScore: {
    fontSize: 20,
    fontWeight: '700',
  },
  flaggedSection: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: spacing.md,
  },
  flaggedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent.warning,
    marginBottom: 10,
  },
  flaggedItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  flaggedBullet: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.accent.warning,
    marginTop: 1,
  },
  flaggedContent: {
    flex: 1,
  },
  flaggedName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  flaggedComment: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  commentSection: {
    marginBottom: spacing.xs,
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  commentHint: {
    fontWeight: '400',
    color: colors.text.muted,
  },
  commentInput: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text.secondary,
    ...typography.body,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  cancelButton: {
    margin: spacing.lg,
    marginTop: spacing.sm,
  },
});

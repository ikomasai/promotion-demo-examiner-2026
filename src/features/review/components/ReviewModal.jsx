/**
 * @fileoverview 審査モーダル — 承認/却下アクション
 * @description 提出の審査を実行するモーダル。AI リスクスコア概要、
 *              指摘事項サマリー、コメント入力を含む。
 *              却下時はコメント必須、承認時は任意。
 * @module features/review/components/ReviewModal
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';

/**
 * リスクスコアの色とラベル
 */
function getRiskInfo(score) {
  if (score === null || score === undefined) return { color: '#a0a0a0', label: '判定なし', bg: '#2d2d44' };
  if (score <= 10) return { color: '#4caf50', label: '低リスク', bg: '#1e3525' };
  if (score <= 50) return { color: '#ff9800', label: '中リスク', bg: '#3d3520' };
  return { color: '#f44336', label: '高リスク', bg: '#3d1e1e' };
}

/**
 * AI 指摘事項から flagged items を抽出
 * @param {Object|null} riskDetails
 * @returns {Array<{name: string, comment: string}>}
 */
function extractFlaggedItems(riskDetails) {
  if (!riskDetails || !Array.isArray(riskDetails.items)) return [];
  return riskDetails.items
    .filter((item) => item.flagged)
    .slice(0, 5);
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
export default function ReviewModal({ visible, submission, onApprove, onReject, onCancel, reviewing }) {
  const [comment, setComment] = useState('');

  // モーダルが開かれる度にコメントをリセット
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
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

            {/* AI リスクスコア */}
            <View style={[styles.riskBox, { backgroundColor: riskInfo.bg }]}>
              <View style={styles.riskHeader}>
                <Text style={[styles.riskLabel, { color: riskInfo.color }]}>
                  {riskInfo.label}
                </Text>
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
                      {item.comment && (
                        <Text style={styles.flaggedComment}>{item.comment}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 審査コメント */}
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>
                審査コメント
                <Text style={styles.commentHint}>
                  {' '}(却下時は必須)
                </Text>
              </Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="コメントを入力..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
                editable={!reviewing}
              />
            </View>
          </ScrollView>

          {/* アクションボタン */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.rejectButton, (!canReject || reviewing) && styles.buttonDisabled]}
              onPress={() => onReject(comment.trim())}
              disabled={!canReject || reviewing}
            >
              {reviewing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.rejectText}>却下する</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.approveButton, reviewing && styles.buttonDisabled]}
              onPress={() => onApprove(comment.trim() || null)}
              disabled={reviewing}
            >
              {reviewing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.approveText}>承認する</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* キャンセル */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={reviewing}
          >
            <Text style={styles.cancelText}>キャンセル</Text>
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
    textAlign: 'center',
    marginBottom: 16,
  },
  fileInfo: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e0e0',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 12,
    color: '#888',
  },
  riskBox: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  riskScore: {
    fontSize: 20,
    fontWeight: '700',
  },
  flaggedSection: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  flaggedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff9800',
    marginBottom: 10,
  },
  flaggedItem: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  flaggedBullet: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff9800',
    marginTop: 1,
  },
  flaggedContent: {
    flex: 1,
  },
  flaggedName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e0e0e0',
  },
  flaggedComment: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  commentSection: {
    marginBottom: 4,
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  commentHint: {
    fontWeight: '400',
    color: '#888',
  },
  commentInput: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    padding: 14,
    color: '#e0e0e0',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f44336',
  },
  approveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4caf50',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  rejectText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  approveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3d3d5c',
    marginTop: 8,
  },
  cancelText: {
    color: '#a0a0a0',
    fontSize: 14,
    fontWeight: '600',
  },
});

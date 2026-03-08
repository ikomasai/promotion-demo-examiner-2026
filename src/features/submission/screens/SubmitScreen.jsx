/**
 * @fileoverview 正式提出画面 - 5フェーズ管理
 * @description 情宣物の正式提出。AI プレチェック → リスクレベル別確認 → 提出の流れ。
 *              phase: 'form' → 'executing' → 'risk_check' → 'submitting' → 'done'
 * @module features/submission/screens/SubmitScreen
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { colors, spacing, typography } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import Banner from '../../../shared/components/Banner';
import SubmissionForm from '../components/SubmissionForm';
import RiskScoreDisplay from '../components/RiskScoreDisplay';
import SubmissionConfirmModal from '../components/SubmissionConfirmModal';
import HighRiskReasonInput from '../components/HighRiskReasonInput';
import { useSubmission } from '../hooks/useSubmission';
import { useAICheckFlow } from '../hooks/useAICheckFlow';

/**
 * リスクレベルを判定
 * @param {number|null} score
 * @param {boolean} skipped
 * @returns {'low'|'medium'|'high'|'skipped'}
 */
function getRiskLevel(score, skipped) {
  if (skipped || score === null || score === undefined) return 'skipped';
  if (score <= 10) return 'low';
  if (score <= 50) return 'medium';
  return 'high';
}

/**
 * 正式提出画面
 */
export default function SubmitScreen() {
  const {
    preChecking,
    submitting,
    submitProgress,
    precheckResult,
    submitResult,
    error,
    precheck,
    submit,
    clearAll,
  } = useSubmission();

  const { isMobile } = useResponsive();

  /** フォームデータを保持（precheck → submit 間で再利用） */
  const formDataRef = useRef(null);

  /** 中リスク確認モーダル */
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  /** 高リスク時のユーザーコメント */
  const [userComment, setUserComment] = useState('');

  // AI判定フロー共通フック
  const {
    phase,
    setPhase,
    showSkipButton,
    elapsedSeconds,
    displayResult: displayPrecheckResult,
    handleReset: resetAIFlow,
    handleSkip,
  } = useAICheckFlow({
    executing: preChecking,
    result: precheckResult,
    error,
    clearResult: clearAll,
    resultPhase: 'risk_check',
  });

  // submitProgress からステップを算出（25%区切り）
  const submitStep = Math.min(Math.floor(submitProgress / 25), 3);

  // submitting 状態でフェーズ遷移
  useEffect(() => {
    if (submitting) {
      setPhase('submitting');
    }
  }, [submitting, setPhase]);

  // submit 完了でフェーズ遷移
  useEffect(() => {
    if (submitting) return;
    if (submitResult) {
      setPhase('done');
    } else if (error && phase === 'submitting') {
      setPhase('risk_check');
    }
  }, [submitResult, error, submitting, phase, setPhase]);

  /** フォーム送信 → AI プレチェック実行 */
  const handlePrecheck = useCallback(
    (formData) => {
      formDataRef.current = formData;
      setUserComment('');
      precheck(formData);
    },
    [precheck],
  );

  /** 正式提出実行 */
  const handleSubmit = useCallback(() => {
    if (!formDataRef.current) return;
    submit(formDataRef.current, userComment || undefined);
  }, [submit, userComment]);

  /** 中リスク: モーダルから確認 → 提出 */
  const handleConfirmSubmit = useCallback(() => {
    setConfirmModalVisible(false);
    handleSubmit();
  }, [handleSubmit]);

  /** リセット → フォームに戻る */
  const handleReset = useCallback(() => {
    resetAIFlow();
    formDataRef.current = null;
    setUserComment('');
  }, [resetAIFlow]);

  const riskLevel = displayPrecheckResult
    ? getRiskLevel(displayPrecheckResult.ai_risk_score, displayPrecheckResult.skipped)
    : 'skipped';

  const isHighRiskReasonValid = userComment.length >= HighRiskReasonInput.MIN_LENGTH;

  /** リスクレベル別アクションボタン */
  const riskActions = useMemo(() => {
    if (!displayPrecheckResult) return null;

    return (
      <View style={styles.riskActions}>
        {riskLevel === 'low' && (
          <Button variant="primary" size="lg" onPress={handleSubmit} style={styles.actionButton}>
            提出する
          </Button>
        )}

        {riskLevel === 'medium' && (
          <Button
            variant="warning"
            size="lg"
            onPress={() => setConfirmModalVisible(true)}
            style={styles.actionButton}
          >
            提出する
          </Button>
        )}

        {riskLevel === 'high' && (
          <>
            <HighRiskReasonInput value={userComment} onChange={setUserComment} disabled={false} />
            <Button
              variant="danger"
              size="lg"
              onPress={handleSubmit}
              disabled={!isHighRiskReasonValid}
              style={styles.actionButton}
            >
              提出する
            </Button>
          </>
        )}

        {riskLevel === 'skipped' && (
          <Button variant="muted" size="lg" onPress={handleSubmit} style={styles.actionButton}>
            AI判定なしで提出する
          </Button>
        )}

        <Button variant="outline" onPress={handleReset} style={styles.actionButton}>
          やり直す
        </Button>
      </View>
    );
  }, [
    riskLevel,
    displayPrecheckResult,
    handleSubmit,
    handleReset,
    userComment,
    isHighRiskReasonValid,
  ]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>正式提出</Text>
      </View>

      {/* エラー表示 */}
      {error && phase !== 'done' && (
        <Banner variant="error" style={styles.errorBanner}>
          {error}
          {(phase === 'form' || phase === 'risk_check') && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleReset}
              style={{ marginTop: spacing.sm }}
            >
              やり直す
            </Button>
          )}
        </Banner>
      )}

      {/* フォームフェーズ */}
      {phase === 'form' && (
        <SubmissionForm
          onSubmit={handlePrecheck}
          loading={false}
          disabled={false}
          submitLabel="AI判定して提出"
        />
      )}

      {/* AI判定実行中フェーズ */}
      {phase === 'executing' && (
        <View style={styles.executingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.executingText}>AI分析中... ({elapsedSeconds}秒)</Text>
          <Banner variant="info" style={styles.executingBanner}>
            通常10〜20秒程度で完了します
          </Banner>
          {showSkipButton && (
            <Button
              variant="outline-warning"
              onPress={handleSkip}
              style={{ marginTop: spacing.md }}
            >
              AI判定をスキップ
            </Button>
          )}
        </View>
      )}

      {/* リスク確認フェーズ */}
      {phase === 'risk_check' && displayPrecheckResult && (
        <RiskScoreDisplay
          result={displayPrecheckResult}
          onReset={handleReset}
          actions={riskActions}
        />
      )}

      {/* 提出中フェーズ — ステップ進捗表示 */}
      {phase === 'submitting' && (
        <View style={styles.executingContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${submitProgress}%` }]} />
          </View>
          <Text style={styles.executingHint}>正式提出を処理しています...</Text>

          <View style={styles.stepList}>
            {[
              'AI判定を実行中...',
              'ファイルをアップロード中...',
              'レポートを生成中...',
              'データを保存中...',
            ].map((label, i) => (
              <View key={i} style={styles.stepRow}>
                {i < submitStep ? (
                  <Text style={styles.stepDone}>✓</Text>
                ) : i === submitStep ? (
                  <ActivityIndicator size="small" color={colors.accent.primary} />
                ) : (
                  <Text style={styles.stepPending}>{i + 1}</Text>
                )}
                <Text
                  style={[
                    styles.stepLabel,
                    i < submitStep && styles.stepLabelDone,
                    i === submitStep && styles.stepLabelActive,
                    i > submitStep && styles.stepLabelPending,
                  ]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 完了フェーズ */}
      {phase === 'done' && submitResult && (
        <View style={styles.doneContainer}>
          <Text style={styles.doneIcon}>✓</Text>
          <Text style={styles.doneTitle}>提出完了</Text>
          <Text style={styles.doneMessage}>正式提出が完了しました。審査結果をお待ちください。</Text>

          {submitResult.auto_approved && (
            <Banner variant="success" style={styles.autoApproveBanner}>
              自動承認されました（リスクスコア: {submitResult.ai_risk_score}%）
            </Banner>
          )}

          <Button variant="outline" onPress={handleReset} style={styles.actionButton}>
            新しい提出を行う
          </Button>
        </View>
      )}

      {/* 中リスク確認モーダル */}
      <SubmissionConfirmModal
        visible={confirmModalVisible}
        score={displayPrecheckResult?.ai_risk_score}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setConfirmModalVisible(false)}
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
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.heading3,
    color: colors.text.primary,
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  executingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xxxl,
  },
  executingText: {
    ...typography.heading4,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.xl,
  },
  executingBanner: {
    marginTop: spacing.lg,
    maxWidth: 320,
  },
  executingHint: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#2a2a3e',
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  stepList: {
    marginTop: spacing.xxl,
    width: '100%',
    maxWidth: 320,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stepDone: {
    color: '#51cf66',
    fontSize: 16,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  stepPending: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
  stepLabel: {
    fontSize: 15,
    marginLeft: spacing.md,
  },
  stepLabelDone: {
    color: colors.text.muted,
  },
  stepLabelActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  stepLabelPending: {
    color: '#555',
  },
  riskActions: {
    marginTop: spacing.sm,
  },
  actionButton: {
    marginTop: spacing.md,
  },
  doneContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: spacing.xxxl,
  },
  doneIcon: {
    fontSize: 48,
    color: colors.accent.success,
    marginBottom: spacing.lg,
  },
  doneTitle: {
    ...typography.heading2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  doneMessage: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  autoApproveBanner: {
    marginBottom: spacing.xxl,
    width: '100%',
  },
});

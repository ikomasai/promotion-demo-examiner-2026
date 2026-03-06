/**
 * @fileoverview 正式提出画面 - 5フェーズ管理
 * @description 情宣物の正式提出。AI プレチェック → リスクレベル別確認 → 提出の流れ。
 *              phase: 'form' → 'executing' → 'risk_check' → 'submitting' → 'done'
 * @module features/submission/screens/SubmitScreen
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { colors, spacing, typography, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import Banner from '../../../shared/components/Banner';
import SubmissionForm from '../components/SubmissionForm';
import RiskScoreDisplay from '../components/RiskScoreDisplay';
import SubmissionConfirmModal from '../components/SubmissionConfirmModal';
import HighRiskReasonInput from '../components/HighRiskReasonInput';
import { useSubmission } from '../hooks/useSubmission';

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

  /** 画面フェーズ管理 */
  const [phase, setPhase] = useState('form');

  /** フォームデータを保持（precheck → submit 間で再利用） */
  const formDataRef = useRef(null);

  /** AI スキップボタン表示フラグ */
  const [showSkipButton, setShowSkipButton] = useState(false);

  /** 経過秒数 */
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedTimerRef = useRef(null);

  /** ユーザーが手動スキップしたかどうか */
  const skippedByUserRef = useRef(false);

  /** タイマー ref */
  const skipTimerRef = useRef(null);

  /** 中リスク確認モーダル */
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  /** 高リスク時のユーザーコメント */
  const [userComment, setUserComment] = useState('');

  /** 提出中ステップ（submitProgress から算出） */

  // preChecking 開始でフェーズ遷移
  useEffect(() => {
    if (preChecking) {
      setPhase('executing');
      setShowSkipButton(false);
      skippedByUserRef.current = false;
      setElapsedSeconds(0);
      // 経過秒数カウント
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
      skipTimerRef.current = setTimeout(() => {
        setShowSkipButton(true);
      }, 30000);
    }
    return () => {
      if (skipTimerRef.current) {
        clearTimeout(skipTimerRef.current);
        skipTimerRef.current = null;
      }
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [preChecking]);

  // precheck 完了後のフェーズ遷移
  useEffect(() => {
    if (preChecking) return;
    if (skippedByUserRef.current) return;
    if (precheckResult) {
      setPhase('risk_check');
    } else if (error && phase === 'executing') {
      setPhase('form');
    }
  }, [precheckResult, error, preChecking, phase]);

  // submitProgress からステップを算出（25%区切り: 0-24→0, 25-49→1, 50-74→2, 75-100→3）
  const submitStep = Math.min(Math.floor(submitProgress / 25), 3);

  // submitting 状態でフェーズ遷移
  useEffect(() => {
    if (submitting) {
      setPhase('submitting');
    }
  }, [submitting]);

  // submit 完了でフェーズ遷移
  useEffect(() => {
    if (submitting) return;
    if (submitResult) {
      setPhase('done');
    } else if (error && phase === 'submitting') {
      // 提出エラー時は risk_check に戻す
      setPhase('risk_check');
    }
  }, [submitResult, error, submitting, phase]);

  /**
   * フォーム送信 → AI プレチェック実行
   */
  const handlePrecheck = useCallback(
    (formData) => {
      formDataRef.current = formData;
      setUserComment('');
      precheck(formData);
    },
    [precheck],
  );

  /**
   * 正式提出実行
   */
  const handleSubmit = useCallback(() => {
    if (!formDataRef.current) return;
    submit(formDataRef.current, userComment || undefined);
  }, [submit, userComment]);

  /**
   * 中リスク: モーダルから確認 → 提出
   */
  const handleConfirmSubmit = useCallback(() => {
    setConfirmModalVisible(false);
    handleSubmit();
  }, [handleSubmit]);

  /**
   * リセット → フォームに戻る
   */
  const handleReset = useCallback(() => {
    clearAll();
    formDataRef.current = null;
    setPhase('form');
    setShowSkipButton(false);
    setUserComment('');
  }, [clearAll]);

  /**
   * AI スキップ → risk_check フェーズへ（synthetic skipped result）
   */
  const handleSkip = useCallback(() => {
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    skippedByUserRef.current = true;
    clearAll();
    setPhase('risk_check');
  }, [clearAll]);

  // 表示用の precheck result（スキップ時は synthetic）
  const displayPrecheckResult = useMemo(() => {
    if (phase === 'risk_check' && !precheckResult) {
      return { ai_risk_score: null, ai_risk_details: null, skipped: true, reason: 'timeout' };
    }
    return precheckResult;
  }, [phase, precheckResult]);

  const riskLevel = displayPrecheckResult
    ? getRiskLevel(displayPrecheckResult.ai_risk_score, displayPrecheckResult.skipped)
    : 'skipped';

  const isHighRiskReasonValid = userComment.length >= HighRiskReasonInput.MIN_LENGTH;

  /**
   * リスクレベル別アクションボタンを構築
   */
  const riskActions = useMemo(() => {
    if (!displayPrecheckResult) return null;

    return (
      <View style={styles.riskActions}>
        {/* 低リスク: 直接提出 */}
        {riskLevel === 'low' && (
          <Button variant="primary" size="lg" onPress={handleSubmit} style={styles.actionButton}>
            提出する
          </Button>
        )}

        {/* 中リスク: 確認モーダル経由 */}
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

        {/* 高リスク: 理由入力 + 提出 */}
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

        {/* スキップ: AI判定なしで提出 */}
        {riskLevel === 'skipped' && (
          <Button variant="muted" size="lg" onPress={handleSubmit} style={styles.actionButton}>
            AI判定なしで提出する
          </Button>
        )}

        {/* やり直しボタン（全リスクレベル共通） */}
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
          {/* 進捗バー */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${submitProgress}%` }]} />
          </View>
          <Text style={styles.executingHint}>正式提出を処理しています...</Text>

          {/* ステップリスト */}
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

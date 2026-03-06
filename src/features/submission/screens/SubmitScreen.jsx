/**
 * @fileoverview 正式提出画面 - 5フェーズ管理
 * @description 情宣物の正式提出。AI プレチェック → リスクレベル別確認 → 提出の流れ。
 *              phase: 'form' → 'executing' → 'risk_check' → 'submitting' → 'done'
 * @module features/submission/screens/SubmitScreen
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useResponsive } from '../../../shared/hooks/useResponsive';
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

  /** ユーザーが手動スキップしたかどうか */
  const skippedByUserRef = useRef(false);

  /** タイマー ref */
  const skipTimerRef = useRef(null);

  /** 中リスク確認モーダル */
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  /** 高リスク時のユーザーコメント */
  const [userComment, setUserComment] = useState('');

  /** 提出中ステップ進捗 */
  const [submitStep, setSubmitStep] = useState(0);
  const submitTimersRef = useRef([]);

  // preChecking 開始でフェーズ遷移
  useEffect(() => {
    if (preChecking) {
      setPhase('executing');
      setShowSkipButton(false);
      skippedByUserRef.current = false;
      skipTimerRef.current = setTimeout(() => {
        setShowSkipButton(true);
      }, 30000);
    }
    return () => {
      if (skipTimerRef.current) {
        clearTimeout(skipTimerRef.current);
        skipTimerRef.current = null;
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

  // submitting 状態でフェーズ遷移 + ステップ進捗タイマー
  useEffect(() => {
    if (submitting) {
      setPhase('submitting');
      setSubmitStep(0);
      const delays = [3000, 7000, 10000]; // ステップ 1→2→3 への遷移タイミング
      const timers = delays.map((delay, i) => setTimeout(() => setSubmitStep(i + 1), delay));
      submitTimersRef.current = timers;
    }
    return () => {
      submitTimersRef.current.forEach(clearTimeout);
      submitTimersRef.current = [];
    };
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
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>提出する</Text>
          </TouchableOpacity>
        )}

        {/* 中リスク: 確認モーダル経由 */}
        {riskLevel === 'medium' && (
          <TouchableOpacity
            style={[styles.submitButton, styles.submitButtonWarning]}
            onPress={() => setConfirmModalVisible(true)}
          >
            <Text style={styles.submitButtonText}>提出する</Text>
          </TouchableOpacity>
        )}

        {/* 高リスク: 理由入力 + 提出 */}
        {riskLevel === 'high' && (
          <>
            <HighRiskReasonInput value={userComment} onChange={setUserComment} disabled={false} />
            <TouchableOpacity
              style={[
                styles.submitButton,
                styles.submitButtonDanger,
                !isHighRiskReasonValid && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isHighRiskReasonValid}
            >
              <Text style={styles.submitButtonText}>提出する</Text>
            </TouchableOpacity>
          </>
        )}

        {/* スキップ: AI判定なしで提出 */}
        {riskLevel === 'skipped' && (
          <TouchableOpacity
            style={[styles.submitButton, styles.submitButtonMuted]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>AI判定なしで提出する</Text>
          </TouchableOpacity>
        )}

        {/* やり直しボタン（全リスクレベル共通） */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>やり直す</Text>
        </TouchableOpacity>
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
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
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
          <ActivityIndicator size="large" color="#4dabf7" />
          <Text style={styles.executingText}>AI判定を実行中...</Text>
          <Text style={styles.executingHint}>
            ファイルをAIが分析しています。しばらくお待ちください。
          </Text>
          {showSkipButton && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>AI判定をスキップ</Text>
            </TouchableOpacity>
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
            <View
              style={[styles.progressBarFill, { width: `${Math.min((submitStep + 1) * 25, 95)}%` }]}
            />
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
                  <ActivityIndicator size="small" color="#4dabf7" />
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
            <View style={styles.autoApproveBanner}>
              <Text style={styles.autoApproveText}>
                自動承認されました（リスクスコア: {submitResult.ai_risk_score}%）
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>新しい提出を行う</Text>
          </TouchableOpacity>
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
    backgroundColor: '#1a1a2e',
  },
  content: {
    paddingBottom: 40,
  },
  contentMobile: {
    paddingHorizontal: 4,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorBanner: {
    backgroundColor: '#3d2f1f',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  errorText: {
    color: '#ff9800',
    fontSize: 13,
    textAlign: 'center',
  },
  executingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  executingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 20,
  },
  executingHint: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#2a2a3e',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#4dabf7',
    borderRadius: 2,
  },
  stepList: {
    marginTop: 24,
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
    marginLeft: 12,
  },
  stepLabelDone: {
    color: '#888',
  },
  stepLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  stepLabelPending: {
    color: '#555',
  },
  skipButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  skipButtonText: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '600',
  },
  riskActions: {
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#4dabf7',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonWarning: {
    backgroundColor: '#ff9800',
  },
  submitButtonDanger: {
    backgroundColor: '#f44336',
  },
  submitButtonMuted: {
    backgroundColor: '#666',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4dabf7',
    marginTop: 12,
  },
  resetButtonText: {
    color: '#4dabf7',
    fontSize: 14,
    fontWeight: '600',
  },
  doneContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  doneIcon: {
    fontSize: 48,
    color: '#4caf50',
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  doneMessage: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  autoApproveBanner: {
    backgroundColor: '#1b3a1b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4caf50',
    marginBottom: 24,
    width: '100%',
  },
  autoApproveText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

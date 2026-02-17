/**
 * @fileoverview サンドボックス画面 - 事前確認機能
 * @description AI判定を事前に試行できる画面（1日3回まで）。
 *              フォーム入力 → AI判定実行 → 結果表示の3フェーズ管理。
 * @module features/submission/screens/SandboxScreen
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import SubmissionForm from '../components/SubmissionForm';
import RiskScoreDisplay from '../components/RiskScoreDisplay';
import { useSandbox } from '../hooks/useSandbox';

/**
 * サンドボックス画面
 * @description 事前確認機能のメイン画面
 *              phase: 'form' → 'executing' → 'result'
 */
export default function SandboxScreen() {
  const {
    remainingCount,
    isLimitReached,
    executing,
    result,
    error,
    executeSandbox,
    clearResult,
  } = useSandbox();

  /** 画面フェーズ管理 */
  const [phase, setPhase] = useState('form');

  /** AI スキップボタン表示フラグ（30秒後に表示） */
  const [showSkipButton, setShowSkipButton] = useState(false);

  /** ユーザーが手動スキップしたかどうか */
  const skippedByUserRef = useRef(false);

  /** タイマー ref */
  const skipTimerRef = useRef(null);

  // executing 状態の変化でフェーズ遷移
  useEffect(() => {
    if (executing) {
      setPhase('executing');
      setShowSkipButton(false);
      skippedByUserRef.current = false;
      // 30秒後にスキップボタン表示
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
  }, [executing]);

  // 実行完了後のフェーズ遷移（result/error/skip いずれかで遷移）
  useEffect(() => {
    if (executing) return;
    if (skippedByUserRef.current) return; // ユーザースキップ済みなら無視
    if (result) {
      setPhase('result');
    } else if (error) {
      setPhase('form'); // エラー時はフォームに戻す
    }
  }, [result, error, executing]);

  /**
   * フォーム送信 → サンドボックス実行
   */
  const handleSubmit = useCallback((formData) => {
    executeSandbox(formData);
  }, [executeSandbox]);

  /**
   * リセット → フォームフェーズに戻る
   */
  const handleReset = useCallback(() => {
    clearResult();
    setPhase('form');
    setShowSkipButton(false);
  }, [clearResult]);

  /**
   * AI スキップ → synthetic skipped result を表示
   */
  const handleSkip = useCallback(() => {
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    // Edge Function のレスポンスが遅れて来ても無視する
    skippedByUserRef.current = true;
    clearResult();
    setPhase('result');
  }, [clearResult]);

  // スキップ用の synthetic result
  const displayResult = useMemo(() => {
    if (phase === 'result' && !result) {
      return { ai_risk_score: null, ai_risk_details: null, skipped: true, reason: 'timeout' };
    }
    return result;
  }, [phase, result]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>サンドボックス（事前確認）</Text>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            残り: {remainingCount}回/本日
          </Text>
        </View>
      </View>

      {/* 上限バナー */}
      {isLimitReached && phase === 'form' && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>
            本日のサンドボックス利用上限に達しました。明日（JST 0:00）にリセットされます。
          </Text>
        </View>
      )}

      {/* エラー表示 */}
      {error && phase !== 'result' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* フォームフェーズ */}
      {phase === 'form' && (
        <SubmissionForm
          onSubmit={handleSubmit}
          loading={false}
          disabled={isLimitReached}
          submitLabel="AI判定を実行"
        />
      )}

      {/* 実行中フェーズ */}
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

      {/* 結果フェーズ */}
      {phase === 'result' && displayResult && (
        <RiskScoreDisplay result={displayResult} onReset={handleReset} />
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  counterBadge: {
    backgroundColor: '#2d2d44',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  counterText: {
    fontSize: 13,
    color: '#4dabf7',
    fontWeight: '600',
  },
  limitBanner: {
    backgroundColor: '#3d1f1f',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  limitText: {
    color: '#f44336',
    fontSize: 13,
    textAlign: 'center',
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
});

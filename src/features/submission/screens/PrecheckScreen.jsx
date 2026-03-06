/**
 * @fileoverview 事前チェック画面 - 事前確認機能
 * @description AI判定を事前に試行できる画面（1日3回まで）。
 *              フォーム入力 → AI判定実行 → 結果表示の3フェーズ管理。
 * @module features/submission/screens/PrecheckScreen
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../../shared/theme';
import Badge from '../../../shared/components/Badge';
import Banner from '../../../shared/components/Banner';
import Button from '../../../shared/components/Button';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import SubmissionForm from '../components/SubmissionForm';
import RiskScoreDisplay from '../components/RiskScoreDisplay';
import { usePrecheck } from '../hooks/usePrecheck';

/**
 * 事前チェック画面
 * @description 事前確認機能のメイン画面
 *              phase: 'form' → 'executing' → 'result'
 */
export default function PrecheckScreen() {
  const { remainingCount, isLimitReached, executing, result, error, executePrecheck, clearResult } =
    usePrecheck();

  const navigation = useNavigation();
  const { isMobile } = useResponsive();

  /** 画面フェーズ管理 */
  const [phase, setPhase] = useState('form');

  /** AI スキップボタン表示フラグ（30秒後に表示） */
  const [showSkipButton, setShowSkipButton] = useState(false);

  /** 経過秒数 */
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedTimerRef = useRef(null);

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
      setElapsedSeconds(0);
      // 経過秒数カウント
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
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
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
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
   * フォーム送信 → 事前チェック実行
   */
  const handleSubmit = useCallback(
    (formData) => {
      executePrecheck(formData);
    },
    [executePrecheck],
  );

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>事前チェック</Text>
        <Badge
          label={`残り: ${remainingCount}回/本日`}
          bg={colors.bg.elevated}
          color={colors.accent.primary}
          size="md"
        />
      </View>

      {/* 上限バナー */}
      {isLimitReached && phase === 'form' && (
        <Banner variant="error" style={styles.banner}>
          本日の事前チェック利用上限に達しました。明日（JST 0:00）にリセットされます。
        </Banner>
      )}

      {/* エラー表示 */}
      {error && phase !== 'result' && (
        <Banner variant="warning" style={styles.banner}>
          {error}
          {phase === 'form' && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleReset}
              style={{ marginTop: spacing.sm }}
            >
              リトライ
            </Button>
          )}
        </Banner>
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

      {/* 結果フェーズ */}
      {phase === 'result' && displayResult && (
        <RiskScoreDisplay
          result={displayResult}
          onReset={handleReset}
          actions={
            <View style={styles.resultActions}>
              <Button
                variant="primary"
                size="lg"
                onPress={() => navigation.navigate('正式提出')}
                style={styles.actionButton}
              >
                正式提出へ進む
              </Button>
              <Button variant="outline" onPress={handleReset} style={styles.actionButton}>
                もう一度試す
              </Button>
            </View>
          }
        />
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.heading3,
    color: colors.text.primary,
  },
  banner: {
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
  resultActions: {
    marginTop: spacing.sm,
  },
  actionButton: {
    marginTop: spacing.md,
  },
});

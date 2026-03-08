/**
 * @fileoverview 事前チェック画面 - 事前確認機能
 * @description AI判定を事前に試行できる画面（1日3回まで）。
 *              フォーム入力 → AI判定実行 → 結果表示の3フェーズ管理。
 * @module features/submission/screens/PrecheckScreen
 */

import React, { useCallback } from 'react';
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
import { useAICheckFlow } from '../hooks/useAICheckFlow';

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

  const { phase, showSkipButton, elapsedSeconds, displayResult, handleReset, handleSkip } =
    useAICheckFlow({
      executing,
      result,
      error,
      clearResult,
      resultPhase: 'result',
    });

  /** フォーム送信 → 事前チェック実行 */
  const handleSubmit = useCallback(
    (formData) => {
      executePrecheck(formData);
    },
    [executePrecheck],
  );

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

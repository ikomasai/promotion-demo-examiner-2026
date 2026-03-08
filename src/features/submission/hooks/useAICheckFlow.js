/**
 * @fileoverview AI判定フロー共通フック
 * @description PrecheckScreen と SubmitScreen で共有する
 *              AI判定中のタイマー、スキップボタン、フェーズ管理ロジック。
 * @module features/submission/hooks/useAICheckFlow
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/** スキップボタン表示までの遅延（ミリ秒） */
const SKIP_DELAY_MS = 30000;

/**
 * AI判定フロー共通フック
 * @param {Object} options
 * @param {boolean} options.executing - AI判定実行中かどうか
 * @param {Object|null} options.result - AI判定結果
 * @param {string|null} options.error - エラーメッセージ
 * @param {Function} options.clearResult - 結果クリア関数
 * @param {string} options.resultPhase - 結果表示時のフェーズ名（'result' | 'risk_check'）
 * @returns {Object} フロー制御用の状態とハンドラー
 */
export function useAICheckFlow({ executing, result, error, clearResult, resultPhase = 'result' }) {
  const [phase, setPhase] = useState('form');
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const elapsedTimerRef = useRef(null);
  const skipTimerRef = useRef(null);
  const skippedByUserRef = useRef(false);

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
      }, SKIP_DELAY_MS);
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

  // 実行完了後のフェーズ遷移
  useEffect(() => {
    if (executing) return;
    if (skippedByUserRef.current) return;
    if (result) {
      setPhase(resultPhase);
    } else if (error && phase === 'executing') {
      setPhase('form');
    }
  }, [result, error, executing, resultPhase, phase]);

  /** リセット → フォームフェーズに戻る */
  const handleReset = useCallback(() => {
    clearResult();
    setPhase('form');
    setShowSkipButton(false);
  }, [clearResult]);

  /** AI スキップ → synthetic skipped result を表示 */
  const handleSkip = useCallback(() => {
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    skippedByUserRef.current = true;
    clearResult();
    setPhase(resultPhase);
  }, [clearResult, resultPhase]);

  /** スキップ時の synthetic result */
  const displayResult = useMemo(() => {
    if (phase === resultPhase && !result) {
      return { ai_risk_score: null, ai_risk_details: null, skipped: true, reason: 'timeout' };
    }
    return result;
  }, [phase, result, resultPhase]);

  return {
    phase,
    setPhase,
    showSkipButton,
    elapsedSeconds,
    displayResult,
    handleReset,
    handleSkip,
  };
}

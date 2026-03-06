/**
 * @fileoverview 正式提出フック
 * @description 正式提出のプレチェック（AI判定のみ）と本提出を提供。
 *              submit Edge Function の precheck/submit モードに対応。
 * @module features/submission/hooks/useSubmission
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../../services/supabase/client';

/**
 * エラーからユーザー向けメッセージを生成
 */
function getErrorMessage(err, fallback) {
  const msg = err?.message?.toLowerCase?.() ?? '';
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'ネットワーク接続を確認して再度お試しください';
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'サーバーの応答がありません。時間をおいて再度お試しください';
  }
  return err?.message ? `${fallback}: ${err.message}` : fallback;
}

/**
 * 正式提出フック
 * @returns {{
 *   preChecking: boolean,
 *   submitting: boolean,
 *   precheckResult: Object|null,
 *   submitResult: Object|null,
 *   error: string|null,
 *   precheck: (formData: Object) => Promise<void>,
 *   submit: (formData: Object, userComment?: string) => Promise<void>,
 *   clearAll: () => void
 * }}
 */
export function useSubmission() {
  const [preChecking, setPreChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const progressTimerRef = useRef(null);
  const [precheckResult, setPrecheckResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [error, setError] = useState(null);

  // 提出中プログレスのクリーンアップ
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  /**
   * プレチェック（AI判定のみ）
   * @param {{ organizationId, projectId, mediaType, submissionType, file }} formData
   */
  const precheck = useCallback(async (formData) => {
    setPreChecking(true);
    setError(null);
    setPrecheckResult(null);

    try {
      const body = new FormData();
      body.append('file', formData.file);
      body.append('organizationId', formData.organizationId);
      body.append('projectId', formData.projectId);
      body.append('mediaType', formData.mediaType);
      body.append('submissionType', formData.submissionType);
      body.append('precheck', 'true');

      const { data, error: invokeError } = await supabase.functions.invoke('submit', {
        body,
      });

      if (invokeError) {
        setError(invokeError.message || 'AI判定に失敗しました');
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      setPrecheckResult(data);
    } catch (err) {
      setError(getErrorMessage(err, 'AI判定に失敗しました'));
      console.error('precheck error:', err);
    } finally {
      setPreChecking(false);
    }
  }, []);

  /**
   * 正式提出
   * @param {{ organizationId, projectId, mediaType, submissionType, file }} formData
   * @param {string} [userComment] - ユーザーコメント（高リスク時の理由など）
   */
  const submit = useCallback(async (formData, userComment) => {
    setSubmitting(true);
    setError(null);
    setSubmitResult(null);
    setSubmitProgress(25);

    // 1秒ごとに5%ずつ85%まで増加
    progressTimerRef.current = setInterval(() => {
      setSubmitProgress((p) => Math.min(p + 5, 85));
    }, 1000);

    try {
      const body = new FormData();
      body.append('file', formData.file);
      body.append('organizationId', formData.organizationId);
      body.append('projectId', formData.projectId);
      body.append('mediaType', formData.mediaType);
      body.append('submissionType', formData.submissionType);
      if (userComment) {
        body.append('userComment', userComment);
      }

      const { data, error: invokeError } = await supabase.functions.invoke('submit', {
        body,
      });

      if (invokeError) {
        setError(invokeError.message || '提出に失敗しました');
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      setSubmitProgress(100);
      setSubmitResult(data);
    } catch (err) {
      setError(getErrorMessage(err, '提出に失敗しました'));
      console.error('submit error:', err);
    } finally {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setSubmitting(false);
    }
  }, []);

  /**
   * 全状態をリセット
   */
  const clearAll = useCallback(() => {
    setPrecheckResult(null);
    setSubmitResult(null);
    setError(null);
  }, []);

  return {
    preChecking,
    submitting,
    submitProgress,
    precheckResult,
    submitResult,
    error,
    precheck,
    submit,
    clearAll,
  };
}

/**
 * @fileoverview 正式提出フック
 * @description 正式提出のプレチェック（AI判定のみ）と本提出を提供。
 *              submit Edge Function の precheck/submit モードに対応。
 * @module features/submission/hooks/useSubmission
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

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
  const [precheckResult, setPrecheckResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [error, setError] = useState(null);

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
      setError('予期しないエラーが発生しました');
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

      setSubmitResult(data);
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error('submit error:', err);
    } finally {
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
    precheckResult,
    submitResult,
    error,
    precheck,
    submit,
    clearAll,
  };
}

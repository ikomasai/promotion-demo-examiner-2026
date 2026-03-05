/**
 * @fileoverview 事前チェック実行フック
 * @description 事前チェックの残回数管理と実行処理を提供。
 *              AuthContext の profile.sandboxCountToday と連携。
 * @module features/submission/hooks/usePrecheck
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';
import { useAuth } from '../../../shared/contexts/AuthContext';

/**
 * JST での本日の日付を YYYY-MM-DD 形式で取得
 */
function getTodayJST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

/**
 * 事前チェック実行フック
 * @returns {{
 *   remainingCount: number,
 *   isLimitReached: boolean,
 *   executing: boolean,
 *   result: Object|null,
 *   error: string|null,
 *   executePrecheck: (formData: Object) => Promise<void>,
 *   clearResult: () => void
 * }}
 */
export function usePrecheck() {
  const { profile, refreshProfile } = useAuth();
  const [dailyLimit, setDailyLimit] = useState(3);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // mount 時に sandbox_daily_limit を取得
  useEffect(() => {
    const fetchLimit = async () => {
      const { data } = await supabase
        .from('josenai_app_settings')
        .select('value')
        .eq('key', 'sandbox_daily_limit')
        .single();

      if (data?.value) {
        setDailyLimit(parseInt(data.value, 10));
      }
    };
    fetchLimit();
  }, []);

  // 有効カウント（JST 日付が異なればリセット）
  const effectiveCount = profile?.sandboxCountDate === getTodayJST()
    ? (profile?.sandboxCountToday ?? 0)
    : 0;

  const remainingCount = Math.max(0, dailyLimit - effectiveCount);
  const isLimitReached = remainingCount <= 0;

  /**
   * 事前チェック実行
   * @param {{ organizationId, projectId, mediaType, submissionType, file }} formData
   */
  const executePrecheck = useCallback(async (formData) => {
    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append('file', formData.file);
      body.append('organizationId', formData.organizationId);
      body.append('projectId', formData.projectId);
      body.append('mediaType', formData.mediaType);
      body.append('submissionType', formData.submissionType);

      const { data, error: invokeError } = await supabase.functions.invoke('sandbox', {
        body,
      });

      if (invokeError) {
        setError(invokeError.message || '事前チェックの実行に失敗しました');
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      setResult(data);

      // カウント更新のためプロフィールを再取得
      await refreshProfile();
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error('executePrecheck error:', err);
    } finally {
      setExecuting(false);
    }
  }, [refreshProfile]);

  /**
   * 結果をクリアしてフォームに戻る
   */
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    remainingCount,
    isLimitReached,
    executing,
    result,
    error,
    executePrecheck,
    clearResult,
  };
}

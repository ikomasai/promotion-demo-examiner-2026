/**
 * @fileoverview 審査アクションフック
 * @description 提出の承認/却下を実行。review Edge Function を呼び出し、
 *              バージョンコンフリクト（409）を検知して呼び出し元に通知。
 * @module features/review/hooks/useReview
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/**
 * 審査アクションフック
 * @returns {{
 *   reviewing: boolean,
 *   error: string|null,
 *   versionConflict: boolean,
 *   review: (submissionId: string, action: string, comment: string|null, version: number) => Promise<boolean>,
 *   clearError: () => void
 * }}
 */
export function useReview() {
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState(null);
  const [versionConflict, setVersionConflict] = useState(false);

  /**
   * 審査を実行
   * @param {string} submissionId
   * @param {'approve'|'reject'} action
   * @param {string|null} comment
   * @param {number} version - 楽観的ロック用バージョン
   * @returns {Promise<boolean>} 成功なら true
   */
  const review = useCallback(async (submissionId, action, comment, version) => {
    setReviewing(true);
    setError(null);
    setVersionConflict(false);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('review', {
        body: { submissionId, action, comment, version },
      });

      if (funcError) {
        setError('審査処理中にエラーが発生しました');
        console.error('review function error:', funcError);
        return false;
      }

      if (data?.error === 'version_conflict') {
        setVersionConflict(true);
        return false;
      }

      if (data?.error) {
        setError(data.error);
        return false;
      }

      return true;
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error('review error:', err);
      return false;
    } finally {
      setReviewing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setVersionConflict(false);
  }, []);

  return { reviewing, error, versionConflict, review, clearError };
}

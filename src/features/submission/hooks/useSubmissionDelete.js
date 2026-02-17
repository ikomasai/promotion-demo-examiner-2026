/**
 * @fileoverview 提出削除フック
 * @description pending 提出の物理削除（DB + Google Drive ベストエフォート）。
 *              RLS が user_id + status='pending' を強制。
 * @module features/submission/hooks/useSubmissionDelete
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/**
 * 提出削除フック
 * @returns {{
 *   deleting: boolean,
 *   deleteSubmission: (submissionId: string, driveFileId: string|null) => Promise<boolean>
 * }}
 */
export function useSubmissionDelete() {
  const [deleting, setDeleting] = useState(false);

  /**
   * 提出を削除
   * @param {string} submissionId - 削除対象の提出 ID
   * @param {string|null} driveFileId - Google Drive ファイル ID（Drive クリーンアップ用）
   * @returns {Promise<boolean>} 成功なら true
   */
  const deleteSubmission = useCallback(async (submissionId, driveFileId) => {
    setDeleting(true);

    try {
      // 1. DB 物理削除（RLS が user_id + status='pending' を強制）
      const { error: deleteError } = await supabase
        .from('josenai_submissions')
        .delete()
        .eq('id', submissionId);

      if (deleteError) {
        console.error('DB delete failed:', deleteError);
        return false;
      }

      // 2. Drive クリーンアップ（ベストエフォート）
      if (driveFileId) {
        try {
          await supabase.functions.invoke('delete-submission', {
            body: { driveFileId },
          });
        } catch (driveErr) {
          // Drive 削除失敗はログのみ（spec: ログ記録のみ）
          console.warn('Drive cleanup failed (best-effort):', driveErr);
        }
      }

      return true;
    } catch (err) {
      console.error('deleteSubmission error:', err);
      return false;
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleting, deleteSubmission };
}

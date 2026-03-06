/**
 * @fileoverview 提出履歴取得フック
 * @description ユーザーの提出一覧を取得。RLS が user_id フィルタを自動適用。
 *              organization/project を JOIN して表示用データを取得。
 * @module features/submission/hooks/useSubmissionHistory
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/**
 * 提出履歴フック
 * @returns {{
 *   submissions: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: () => Promise<void>
 * }}
 */
export function useSubmissionHistory() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('josenai_submissions')
        .select(
          `
          id, submission_type, media_type, file_name, file_size_bytes,
          drive_file_id, drive_file_url, docs_file_url,
          ai_risk_score, ai_risk_details, status,
          user_comment, reviewer_comment, reviewed_at, reviewed_by,
          created_at,
          organization:josenai_organizations(organization_name),
          project:josenai_projects(project_name)
        `,
        )
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message || '提出履歴の取得に失敗しました');
        return;
      }

      setSubmissions(data || []);
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error('fetchSubmissions error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    loading,
    error,
    refresh: fetchSubmissions,
  };
}

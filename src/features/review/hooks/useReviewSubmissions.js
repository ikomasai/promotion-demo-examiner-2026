/**
 * @fileoverview 審査対象の提出一覧取得フック
 * @description 審査者のロールに応じた提出を取得。RLS が自動でロールベースフィルタリング
 *              （koho→koho提出のみ、kikaku→kikaku提出のみ、admin→全件）。
 *              サーバーサイド＋クライアントサイドのフィルタ、stats 算出を提供。
 * @module features/review/hooks/useReviewSubmissions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../services/supabase/client';

/**
 * 自動承認かどうかを判定
 * @param {{ reviewed_by: string|null, status: string }} submission
 * @returns {boolean}
 */
function isAutoApproved(submission) {
  return submission.reviewed_by === null && submission.status === 'approved';
}

/**
 * 審査提出一覧フック
 * @param {{
 *   status?: string|null,
 *   submissionType?: string|null,
 *   autoApproveFilter?: string|null
 * }} filters
 * @returns {{
 *   submissions: Array,
 *   loading: boolean,
 *   error: string|null,
 *   stats: { pending: number, approved: number, rejected: number, total: number },
 *   refresh: () => Promise<void>
 * }}
 */
export function useReviewSubmissions(filters = {}) {
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('josenai_submissions')
        .select(
          `
          id, submission_type, media_type, file_name, file_size_bytes,
          drive_file_id, drive_file_url, docs_file_url,
          ai_risk_score, ai_risk_details, status,
          user_comment, reviewer_comment, reviewed_at, reviewed_by,
          version, created_at, updated_at,
          organization:josenai_organizations(organization_name),
          project:josenai_projects(project_name)
        `,
        )
        .order('created_at', { ascending: false });

      // サーバーサイドフィルタ: submissionType（admin のみ使用）
      if (filters.submissionType) {
        query = query.eq('submission_type', filters.submissionType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message || '提出一覧の取得に失敗しました');
        return;
      }

      setAllSubmissions(data || []);
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error('fetchReviewSubmissions error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.submissionType]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // stats: フィルタ前の全データから算出
  const stats = useMemo(() => {
    const pending = allSubmissions.filter((s) => s.status === 'pending').length;
    const approved = allSubmissions.filter((s) => s.status === 'approved').length;
    const rejected = allSubmissions.filter((s) => s.status === 'rejected').length;
    return { pending, approved, rejected, total: allSubmissions.length };
  }, [allSubmissions]);

  // クライアントサイドフィルタ適用
  const submissions = useMemo(() => {
    let filtered = allSubmissions;

    // ステータスフィルタ
    if (filters.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    // 自動承認フィルタ
    if (filters.autoApproveFilter === 'auto_only') {
      filtered = filtered.filter((s) => isAutoApproved(s));
    } else if (filters.autoApproveFilter === 'manual_only') {
      filtered = filtered.filter((s) => !isAutoApproved(s));
    }

    return filtered;
  }, [allSubmissions, filters.status, filters.autoApproveFilter]);

  return {
    submissions,
    loading,
    error,
    stats,
    refresh: fetchSubmissions,
  };
}

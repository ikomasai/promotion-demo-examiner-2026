/**
 * @fileoverview 企画一覧取得フック（団体IDでフィルタ）
 * @module features/submission/hooks/useProjects
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase/client';

/**
 * 指定団体のアクティブな企画一覧を取得するフック
 * @param {string|null} organizationId - 団体ID（null の場合は空配列を返す）
 * @returns {{ projects: Array, loading: boolean, error: string|null }}
 */
export function useProjects(organizationId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!organizationId) {
      setProjects([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('josenai_projects')
        .select('id, project_code, project_name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('project_code');

      if (cancelled) return;

      if (fetchError) {
        setError('企画一覧の取得に失敗しました');
        console.error('useProjects error:', fetchError);
      } else {
        setProjects(data ?? []);
      }
      setLoading(false);
    };

    fetch();
    return () => { cancelled = true; };
  }, [organizationId]);

  return { projects, loading, error };
}

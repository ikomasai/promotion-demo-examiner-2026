/**
 * @fileoverview 企画一覧取得フック（団体IDでフィルタ）
 * @module features/submission/hooks/useProjects
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase/client';

/** モジュールスコープキャッシュ（organizationId別、TTL: 5分） */
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * 指定団体のアクティブな企画一覧を取得するフック
 * @param {string|null} organizationId - 団体ID（null の場合は空配列を返す）
 * @returns {{ projects: Array, loading: boolean, error: string|null }}
 */
export function useProjects(organizationId) {
  const cached = organizationId ? _cache.get(organizationId) : null;
  const isCacheValid = cached && Date.now() - cached.timestamp < CACHE_TTL;

  const [projects, setProjects] = useState(isCacheValid ? cached.data : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!organizationId) {
      setProjects([]);
      setLoading(false);
      setError(null);
      return;
    }

    const entry = _cache.get(organizationId);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      setProjects(entry.data);
      setLoading(false);
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
        const result = data ?? [];
        _cache.set(organizationId, { data: result, timestamp: Date.now() });
        setProjects(result);
      }
      setLoading(false);
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return { projects, loading, error };
}

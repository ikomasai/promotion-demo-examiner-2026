/**
 * @fileoverview 団体一覧取得フック
 * @module features/submission/hooks/useOrganizations
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase/client';

/** モジュールスコープキャッシュ（TTL: 5分） */
let _cache = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

/**
 * アクティブな団体一覧を取得するフック
 * @returns {{ organizations: Array, loading: boolean, error: string|null }}
 */
export function useOrganizations() {
  const [organizations, setOrganizations] = useState(_cache.data ?? []);
  const [loading, setLoading] = useState(!_cache.data);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (_cache.data && Date.now() - _cache.timestamp < CACHE_TTL) {
      setOrganizations(_cache.data);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('josenai_organizations')
        .select('id, organization_code, organization_name, category')
        .eq('is_active', true)
        .order('organization_code');

      if (cancelled) return;

      if (fetchError) {
        setError('団体一覧の取得に失敗しました');
        console.error('useOrganizations error:', fetchError);
      } else {
        const result = data ?? [];
        _cache = { data: result, timestamp: Date.now() };
        setOrganizations(result);
      }
      setLoading(false);
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  return { organizations, loading, error };
}

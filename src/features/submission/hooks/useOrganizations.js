/**
 * @fileoverview 団体一覧取得フック
 * @module features/submission/hooks/useOrganizations
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase/client';

/**
 * アクティブな団体一覧を取得するフック
 * @returns {{ organizations: Array, loading: boolean, error: string|null }}
 */
export function useOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
        setOrganizations(data ?? []);
      }
      setLoading(false);
    };

    fetch();
    return () => { cancelled = true; };
  }, []);

  return { organizations, loading, error };
}

/**
 * @fileoverview マスタデータ取得フック
 * @description 団体・企画の全件取得（is_active 問わず）。
 *              MasterScreen 用に全カラム + refresh 機能付き。
 * @module features/master/hooks/useMasterData
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/**
 * マスタデータ取得フック
 * @returns {{
 *   organizations: Array,
 *   projects: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: () => void
 * }}
 */
export function useMasterData() {
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 団体と企画を並列取得
      const [orgResult, projResult] = await Promise.all([
        supabase
          .from('josenai_organizations')
          .select('id, organization_code, organization_name, category, is_active, updated_at')
          .order('organization_code'),
        supabase
          .from('josenai_projects')
          .select(`
            id, project_code, project_name, is_active, updated_at,
            organization:josenai_organizations!organization_id (organization_code)
          `)
          .order('project_code'),
      ]);

      if (orgResult.error) {
        setError('団体データの取得に失敗しました');
        console.error('useMasterData organizations error:', orgResult.error);
        return;
      }

      if (projResult.error) {
        setError('企画データの取得に失敗しました');
        console.error('useMasterData projects error:', projResult.error);
        return;
      }

      setOrganizations(orgResult.data ?? []);
      setProjects(projResult.data ?? []);
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
      console.error('useMasterData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { organizations, projects, loading, error, refresh: fetchData };
}

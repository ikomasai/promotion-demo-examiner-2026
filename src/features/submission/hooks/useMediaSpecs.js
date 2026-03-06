/**
 * @fileoverview メディア規格取得フック
 * @module features/submission/hooks/useMediaSpecs
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/** モジュールスコープキャッシュ（TTL: 5分） */
let _cache = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

/**
 * アクティブなメディア規格一覧を取得するフック
 * @returns {{
 *   mediaSpecs: Array,
 *   loading: boolean,
 *   error: string|null,
 *   getSpecByType: (mediaType: string) => Object|undefined
 * }}
 */
export function useMediaSpecs() {
  const [mediaSpecs, setMediaSpecs] = useState(_cache.data ?? []);
  const [loading, setLoading] = useState(!_cache.data);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (_cache.data && Date.now() - _cache.timestamp < CACHE_TTL) {
      setMediaSpecs(_cache.data);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('josenai_media_specs')
        .select('id, media_type, display_name, allowed_extensions, max_file_size_mb')
        .eq('is_active', true)
        .order('display_name');

      if (cancelled) return;

      if (fetchError) {
        setError('メディア規格の取得に失敗しました');
        console.error('useMediaSpecs error:', fetchError);
      } else {
        const result = data ?? [];
        _cache = { data: result, timestamp: Date.now() };
        setMediaSpecs(result);
      }
      setLoading(false);
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * mediaType でスペックを検索
   * @param {string} mediaType
   * @returns {Object|undefined}
   */
  const getSpecByType = useCallback(
    (mediaType) => mediaSpecs.find((s) => s.media_type === mediaType),
    [mediaSpecs],
  );

  return { mediaSpecs, loading, error, getSpecByType };
}

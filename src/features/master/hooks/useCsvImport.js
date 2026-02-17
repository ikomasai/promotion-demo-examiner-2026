/**
 * @fileoverview CSV インポートフック
 * @description Edge Function（import-organizations / import-projects）を呼び出し、
 *              CSV ファイルをサーバーサイドで処理。FormData でファイルを送信。
 * @module features/master/hooks/useCsvImport
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/**
 * CSV インポートフック
 * @returns {{
 *   importing: boolean,
 *   error: string|null,
 *   importCsv: (file: File, type: 'organizations'|'projects') => Promise<{success: boolean, count?: number, error?: string}>
 * }}
 */
export function useCsvImport() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * CSV ファイルをインポート
   * @param {File} file - CSV ファイル
   * @param {'organizations'|'projects'} type - インポート種別
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  const importCsv = useCallback(async (file, type) => {
    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = type === 'organizations'
        ? 'import-organizations'
        : 'import-projects';

      const { data, error: funcError } = await supabase.functions.invoke(endpoint, {
        body: formData,
      });

      if (funcError) {
        const msg = 'インポート処理中にエラーが発生しました';
        setError(msg);
        console.error(`${endpoint} invoke error:`, funcError);
        return { success: false, error: msg };
      }

      if (!data?.success) {
        const msg = data?.error || 'インポートに失敗しました';
        setError(msg);
        return { success: false, error: msg };
      }

      return { success: true, count: data.count };
    } catch (err) {
      const msg = '予期しないエラーが発生しました';
      setError(msg);
      console.error('importCsv error:', err);
      return { success: false, error: msg };
    } finally {
      setImporting(false);
    }
  }, []);

  return { importing, error, importCsv };
}

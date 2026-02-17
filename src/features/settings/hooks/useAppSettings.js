/**
 * @fileoverview システム設定 CRUD フック
 * @description josenai_app_settings テーブルの読み取り・更新を提供。
 *              パスワードハッシュキーは除外し、設定値のみを key-value マップで返す。
 *              フィールド単位の即時保存（楽観的更新）。
 * @module features/settings/hooks/useAppSettings
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/** パスワードハッシュキー（クライアント表示から除外） */
const PASSWORD_KEYS = new Set([
  'koho_admin_password_hash',
  'kikaku_admin_password_hash',
  'super_admin_password_hash',
]);

/**
 * システム設定フック
 * @returns {{
 *   settings: Record<string, string>,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: () => Promise<void>,
 *   updateSetting: (key: string, value: string) => Promise<{ success: boolean, error?: string }>,
 *   updating: boolean
 * }}
 */
export function useAppSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('josenai_app_settings')
        .select('key, value')
        .order('key', { ascending: true });

      if (fetchError) {
        setError(fetchError.message || '設定の取得に失敗しました');
        return;
      }

      // key-value マップに変換（パスワードキー除外）
      const map = {};
      (data || []).forEach((row) => {
        if (!PASSWORD_KEYS.has(row.key)) {
          map[row.key] = row.value;
        }
      });
      setSettings(map);
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error('fetchAppSettings error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * 設定値を個別更新（admin のみ — RLS 制御）
   * @param {string} key - 設定キー
   * @param {string} value - 新しい値
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const updateSetting = useCallback(async (key, value) => {
    setUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from('josenai_app_settings')
        .update({ value })
        .eq('key', key);

      if (updateError) {
        return { success: false, error: updateError.message || '設定の更新に失敗しました' };
      }

      // 楽観的にローカル state を更新
      setSettings((prev) => ({ ...prev, [key]: value }));
      return { success: true };
    } catch (err) {
      console.error('updateSetting error:', err);
      return { success: false, error: '予期しないエラーが発生しました' };
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
    updateSetting,
    updating,
  };
}

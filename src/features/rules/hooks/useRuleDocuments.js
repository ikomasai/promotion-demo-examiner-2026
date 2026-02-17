/**
 * @fileoverview ルール文書 CRUD フック
 * @description josenai_rule_documents テーブルからアクティブ文書を取得し、
 *              審査者による更新（タイトル・本文・バージョン +1）を提供。
 *              RLS が UPDATE 権限を fn_is_josenai_reviewer() で制御。
 * @module features/rules/hooks/useRuleDocuments
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/**
 * ルール文書フック
 * @returns {{
 *   documents: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: () => Promise<void>,
 *   updateDocument: (id: string, updates: { title: string, content: string }, currentVersion: number) => Promise<{ success: boolean, error?: string }>
 * }}
 */
export function useRuleDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('josenai_rule_documents')
        .select('*')
        .eq('is_active', true)
        .order('document_type', { ascending: true });

      if (fetchError) {
        setError(fetchError.message || 'ルール文書の取得に失敗しました');
        return;
      }

      setDocuments(data || []);
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error('fetchRuleDocuments error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /**
   * 文書を更新（審査者のみ — RLS 制御）
   * @param {string} id - 文書 UUID
   * @param {{ title: string, content: string }} updates
   * @param {number} currentVersion - 現在のバージョン番号
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const updateDocument = useCallback(async (id, updates, currentVersion) => {
    try {
      const { data, error: updateError } = await supabase
        .from('josenai_rule_documents')
        .update({
          title: updates.title,
          content: updates.content,
          version: currentVersion + 1,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message || '更新に失敗しました' };
      }

      // ローカル state を更新（再 fetch 不要）
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? data : doc)),
      );

      return { success: true };
    } catch (err) {
      console.error('updateDocument error:', err);
      return { success: false, error: '予期しないエラーが発生しました' };
    }
  }, []);

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
    updateDocument,
  };
}

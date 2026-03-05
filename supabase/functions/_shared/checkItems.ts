/**
 * @fileoverview チェック項目取得の共有モジュール
 * @module supabase/functions/_shared/checkItems
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** チェック項目の型 */
export interface CheckItem {
  item_code: string;
  item_name: string;
  description: string;
  category: string;
  risk_weight: number;
}

/**
 * アクティブなチェック項目を取得
 * @param supabaseAdmin サービスロール Supabase クライアント
 * @returns チェック項目配列、またはエラー時 null
 */
export async function fetchActiveCheckItems(
  supabaseAdmin: SupabaseClient,
): Promise<CheckItem[] | null> {
  const { data, error } = await supabaseAdmin
    .from('josenai_check_items')
    .select('item_code, item_name, description, category, risk_weight')
    .eq('is_active', true)
    .order('category')
    .order('display_order');

  if (error || !data?.length) {
    return null;
  }

  return data as CheckItem[];
}

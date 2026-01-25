/**
 * @fileoverview ルール管理画面 - 情宣ルール・ガイドライン
 * @description 情宣ルール・ガイドラインの閲覧と編集。
 *              Markdown 形式で管理し、バージョン履歴を保持。
 * @module features/rules/screens/RuleListScreen
 */

import React from 'react';
import PlaceholderContent from '../../../shared/components/PlaceholderContent';

/**
 * ルール管理画面
 * @description ルール文書の一覧・編集画面（Phase 7 で本実装予定）
 * @returns {React.ReactElement}
 */
export default function RuleListScreen() {
  return (
    <PlaceholderContent
      screenName="ルール管理"
      description="情宣ルールとガイドラインを管理できます（管理者専用）"
    />
  );
}

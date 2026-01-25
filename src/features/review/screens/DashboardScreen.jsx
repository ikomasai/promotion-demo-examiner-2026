/**
 * @fileoverview ダッシュボード画面 - 管理者審査機能
 * @description 担当範囲の提出一覧表示と審査機能。
 *              koho は SNS提出、kikaku は企画物、super は全て審査可能。
 * @module features/review/screens/DashboardScreen
 */

import React from 'react';
import PlaceholderContent from '../../../shared/components/PlaceholderContent';

/**
 * ダッシュボード画面
 * @description 管理者向け審査ダッシュボード（Phase 6 で本実装予定）
 * @returns {React.ReactElement}
 */
export default function DashboardScreen() {
  return (
    <PlaceholderContent
      screenName="審査ダッシュボード"
      description="担当範囲の提出物を審査できます（管理者専用）"
    />
  );
}

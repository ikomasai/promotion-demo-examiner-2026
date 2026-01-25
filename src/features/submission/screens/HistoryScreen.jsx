/**
 * @fileoverview 提出履歴画面 - 過去の提出一覧
 * @description 自分の提出履歴を確認できる画面。
 *              ステータス（審査中/承認/却下）と詳細を表示。
 * @module features/submission/screens/HistoryScreen
 */

import React from 'react';
import PlaceholderContent from '../../../shared/components/PlaceholderContent';

/**
 * 提出履歴画面
 * @description 提出履歴のメイン画面（Phase 5 で本実装予定）
 * @returns {React.ReactElement}
 */
export default function HistoryScreen() {
  return (
    <PlaceholderContent
      screenName="提出履歴"
      description="過去の提出とその審査状況を確認できます"
    />
  );
}

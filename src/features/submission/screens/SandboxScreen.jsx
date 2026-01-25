/**
 * @fileoverview サンドボックス画面 - 事前確認機能
 * @description AI判定を事前に試行できる画面（1日3回まで）。
 *              ファイルアップロードとリスク判定を提供。
 * @module features/submission/screens/SandboxScreen
 */

import React from 'react';
import PlaceholderContent from '../../../shared/components/PlaceholderContent';

/**
 * サンドボックス画面
 * @description 事前確認機能のメイン画面（Phase 3 で本実装予定）
 * @returns {React.ReactElement}
 */
export default function SandboxScreen() {
  return (
    <PlaceholderContent
      screenName="サンドボックス"
      description="AI判定を事前に試行できます（1日3回まで）"
    />
  );
}

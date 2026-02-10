/**
 * @fileoverview マスタ管理画面 - 団体・企画管理
 * @description 団体・企画の CSV インポートによる一括管理。
 *              スーパー管理者のみアクセス可能。
 * @module features/master/screens/MasterScreen
 */

import React from 'react';
import PlaceholderContent from '../../../shared/components/PlaceholderContent';

/**
 * マスタ管理画面
 * @description 団体・企画のマスタ管理画面（Phase 8 で本実装予定）
 * @returns {React.ReactElement}
 */
export default function MasterScreen() {
  return (
    <PlaceholderContent
      screenName="マスタ管理"
      description="団体・企画データを CSV でインポートできます（super管理者専用）"
    />
  );
}

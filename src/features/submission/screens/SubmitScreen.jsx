/**
 * @fileoverview 正式提出画面 - 情宣物の正式提出
 * @description 企画物/SNS を選択して正式提出。
 *              Google Drive に保存し、審査待ちステータスになる。
 * @module features/submission/screens/SubmitScreen
 */

import React from 'react';
import PlaceholderContent from '../../../shared/components/PlaceholderContent';

/**
 * 正式提出画面
 * @description 正式提出機能のメイン画面（Phase 4 で本実装予定）
 * @returns {React.ReactElement}
 */
export default function SubmitScreen() {
  return (
    <PlaceholderContent
      screenName="正式提出"
      description="情宣物を正式に提出し、審査を依頼します"
    />
  );
}

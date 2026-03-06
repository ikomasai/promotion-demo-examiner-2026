/**
 * @fileoverview 提出ステータスバッジ
 * @description pending/approved/rejected の状態を色分けピルバッジで表示。
 * @module features/submission/components/StatusBadge
 */

import React from 'react';
import Badge from '../../../shared/components/Badge';
import { STATUS_CONFIG } from '../../../shared/constants/statusConfig';

/**
 * ステータスバッジ
 * @param {{ status: 'pending'|'approved'|'rejected' }} props
 */
export default React.memo(function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return <Badge label={config.label} bg={config.bg} color={config.text} />;
});

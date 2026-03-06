/**
 * @fileoverview バッジ設定の一元管理
 * @description ステータス・提出先・文書種別のバッジ色とラベルを定義。
 * @module shared/constants/statusConfig
 */

import { colors } from '../theme';

/** 提出ステータスバッジ設定（StatusBadge 用） */
export const STATUS_CONFIG = {
  pending:  { bg: colors.surfaceTint.warning, text: colors.accent.warning, label: '審査中' },
  approved: { bg: colors.surfaceTint.success, text: colors.accent.success, label: '承認済' },
  rejected: { bg: colors.surfaceTint.danger, text: colors.accent.danger, label: '却下' },
};

/** 提出先バッジ設定（SubmissionTable 用） */
export const SUBMISSION_TYPE_CONFIG = {
  koho:   { bg: colors.surfaceTint.primary, text: colors.accent.primary, label: '広報部' },
  kikaku: { bg: colors.surfaceTint.purple, text: colors.accent.purple, label: '企画管理部' },
};

/** 文書種別バッジ設定（RuleDocumentCard 用） */
export const DOCUMENT_TYPE_CONFIG = {
  josenai_rule:        { bg: colors.surfaceTint.success, text: colors.accent.success, label: 'ルール' },
  copyright_guideline: { bg: colors.surfaceTint.warning, text: colors.accent.warning, label: '著作権' },
  submission_guide:    { bg: colors.surfaceTint.primary, text: colors.accent.primary, label: '提出ガイド' },
};

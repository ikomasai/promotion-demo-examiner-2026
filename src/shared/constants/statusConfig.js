/**
 * @fileoverview バッジ設定の一元管理
 * @description ステータス・提出先・文書種別のバッジ色とラベルを定義。
 *              各コンポーネントで個別に定義していた設定を統合。
 * @module shared/constants/statusConfig
 */

/** 提出ステータスバッジ設定（StatusBadge 用） */
export const STATUS_CONFIG = {
  pending:  { bg: '#3d3520', text: '#ff9800', label: '審査中' },
  approved: { bg: '#1e3525', text: '#4caf50', label: '承認済' },
  rejected: { bg: '#3d1e1e', text: '#f44336', label: '却下' },
};

/** 提出先バッジ設定（SubmissionTable 用） */
export const SUBMISSION_TYPE_CONFIG = {
  koho:   { bg: '#1e2d44', text: '#4dabf7', label: '広報部' },
  kikaku: { bg: '#2d1e44', text: '#ab47bc', label: '企画管理部' },
};

/** 文書種別バッジ設定（RuleDocumentCard 用） */
export const DOCUMENT_TYPE_CONFIG = {
  josenai_rule:        { bg: '#1e3525', text: '#4caf50', label: 'ルール' },
  copyright_guideline: { bg: '#3d3520', text: '#ff9800', label: '著作権' },
  submission_guide:    { bg: '#1e2d44', text: '#4dabf7', label: '提出ガイド' },
};

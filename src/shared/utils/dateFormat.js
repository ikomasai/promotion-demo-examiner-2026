/**
 * @fileoverview 日付フォーマットユーティリティ
 * @module shared/utils/dateFormat
 */

/**
 * ISO 文字列を JST 表示用にフォーマット
 * @param {string|null|undefined} isoString - ISO 8601 形式の日時文字列
 * @returns {string} JST でフォーマットされた日時文字列
 */
export function formatDateJST(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

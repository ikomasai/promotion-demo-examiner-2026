/**
 * @fileoverview メールアドレスバリデーション
 * @description @kindai.ac.jp ドメイン制限の一元管理
 * @module shared/utils/validateEmail
 */

/** @constant {string} 許可されるメールドメイン */
export const ALLOWED_DOMAIN = '@kindai.ac.jp';

/**
 * 許可ドメインかどうかを判定
 * @param {string|undefined|null} email
 * @returns {boolean}
 */
export function isAllowedDomain(email) {
  return !!email && email.endsWith(ALLOWED_DOMAIN);
}

/**
 * @fileoverview 管理者設定の集約モジュール
 * @description config/admin.json を単一ソースとし、フロントエンド用の定数を導出する。
 * @module shared/constants/adminConfig
 */

import config from '../../../config/admin.json';

/** screen 識別子の定数 */
export const SCREENS = config.screens;

/**
 * RoleType → 付与する screen のマッピング
 * @type {Record<string, string[]>}
 */
export const ROLE_TO_SCREENS = Object.fromEntries(
  Object.entries(config.roles).map(([key, role]) => [key, role.screens]),
);

/**
 * 権限オプション（モーダル表示用）
 * @type {Array<{value: string, label: string, description: string}>}
 */
export const ROLE_OPTIONS = Object.entries(config.roles).map(([key, role]) => ({
  value: key,
  label: role.label,
  description: role.description,
}));

/**
 * ロール → 表示名のマッピング
 * @type {Record<string, string>}
 */
export const ROLE_LABELS = Object.fromEntries(
  Object.entries(config.roles).map(([key, role]) => [key, role.label]),
);

/**
 * パスワードハッシュキーの Set（クライアント表示から除外用）
 * @type {Set<string>}
 */
export const PASSWORD_KEYS = new Set(
  Object.values(config.roles).map((role) => role.passwordKey),
);

/** パスワード最小文字数 */
export const MIN_PASSWORD_LENGTH = config.validation.minPasswordLength;

/** アプリケーションデフォルト設定値 */
export const APP_DEFAULTS = config.defaults;

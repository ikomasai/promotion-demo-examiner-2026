/**
 * @fileoverview 管理者設定の集約モジュール（Edge Functions 用）
 * @description admin.json を単一ソースとし、バックエンド用の定数を導出する。
 * @module supabase/functions/_shared/adminConfig
 */

import config from './admin.json' with { type: 'json' };

/** ロール → パスワードハッシュキーのマッピング */
export const PASSWORD_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(config.roles).map(([key, role]) => [key, role.passwordKey]),
);

/** パスワード最小文字数 */
export const MIN_PASSWORD_LENGTH: number = config.validation.minPasswordLength;

/** アプリケーションデフォルト設定値 */
export const APP_DEFAULTS = config.defaults;

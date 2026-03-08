/**
 * @fileoverview リトライ共有ユーティリティ
 * @description 指数バックオフ + ジッター付きリトライ。
 * @module supabase/functions/_shared/retry
 */

/** リトライオプション */
interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: (err: unknown) => boolean;
}

/**
 * リトライ可能なエラーかどうかを判定するデフォルト関数
 * @description 4xx クライアントエラー（400, 401, 403, 404, 409）はリトライ不要。
 *              5xx サーバーエラーやネットワークエラーのみリトライする。
 */
function isRetryableError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    // Supabase PostgREST エラー: status プロパティを持つ
    const status = (err as Record<string, unknown>).status;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return false;
    }
    // fetch エラー: HTTP ステータスコードを持つ場合
    const code = (err as Record<string, unknown>).code;
    if (typeof code === 'string' && ['PGRST301', 'PGRST116'].includes(code)) {
      return false; // not found 等
    }
  }
  return true;
}

/**
 * 指数バックオフ + ジッター付きリトライ
 * @param fn 実行する非同期関数
 * @param options リトライ設定
 * @returns fn の戻り値
 * @throws maxAttempts 到達後、最後のエラーを throw
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    retryableErrors = isRetryableError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxAttempts - 1 || !retryableErrors(err)) {
        throw err;
      }

      const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
      const jitter = delay * Math.random() * 0.3;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}

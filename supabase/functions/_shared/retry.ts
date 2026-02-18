/**
 * @fileoverview リトライ + エラーレスポンス共有ユーティリティ
 * @description 指数バックオフ + ジッター付きリトライと、
 *              標準化された JSON エラーレスポンス生成ヘルパー。
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
 * 指数バックオフ + ジッター付きリトライ
 * @param fn 実行する非同期関数
 * @param options リトライ設定
 * @returns fn の戻り値
 * @throws maxAttempts 到達後、最後のエラーを throw
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    retryableErrors = () => true,
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

/**
 * 標準化された JSON エラーレスポンスを生成
 * @param message エラーメッセージ
 * @param status HTTP ステータスコード
 * @param corsHeaders CORS ヘッダー
 */
export function errorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}

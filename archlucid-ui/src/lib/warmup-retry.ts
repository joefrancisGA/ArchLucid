/** TB-757: bounded retry for brief 502/503 while API revision warms after deploy. */

export const WARMUP_RETRYABLE_HTTP_STATUSES = new Set([502, 503]);

/** One original attempt plus two short retries (TB-757). */
export const WARMUP_MAX_ATTEMPTS = 3;

export const WARMUP_RETRY_BASE_DELAY_MS = 400;

export function isWarmupRetryableProxyConfigProblem(bodyText: string): boolean {
  return /Invalid upstream API configuration/i.test(bodyText);
}

export function isWarmupRetryableHttpResponse(status: number, bodyText: string): boolean {
  if (!WARMUP_RETRYABLE_HTTP_STATUSES.has(status)) {
    return false;
  }

  if (status === 503 && isWarmupRetryableProxyConfigProblem(bodyText)) {
    return false;
  }

  return true;
}

/**
 * Transport errors that look like a hung upstream completing past AbortSignal.timeout —
 * not a brief Container Apps warm-up blip. Retrying these multiplies user wait (~60s × 3).
 */
export function isWarmupRetryableTransportError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return true;
  }

  if (err.name === "AbortError" || err.name === "TimeoutError") {
    return false;
  }

  if (/aborted due to timeout/i.test(err.message)) {
    return false;
  }

  return true;
}

export function warmupRetryDelayMs(attemptIndex: number): number {
  return WARMUP_RETRY_BASE_DELAY_MS * (attemptIndex + 1);
}

export async function delayForWarmupRetry(attemptIndex: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, warmupRetryDelayMs(attemptIndex)));
}

export type WarmupRetryOptions = {
  readonly maxAttempts?: number;
  readonly isRetryableResponse?: (status: number, bodyText: string) => boolean;
  readonly onRetry?: (params: {
    readonly attemptIndex: number;
    readonly reason: "transport" | "http";
    readonly status?: number;
  }) => void;
};

/**
 * Retries idempotent GET fetches on transient 502/503 or transport failures.
 * Callers must only use this for safe, idempotent reads.
 */
export async function fetchWithWarmupRetry(
  fetchOnce: () => Promise<Response>,
  options?: WarmupRetryOptions,
): Promise<Response> {
  const maxAttempts = options?.maxAttempts ?? WARMUP_MAX_ATTEMPTS;
  const isRetryableResponse =
    options?.isRetryableResponse
    ?? ((status: number, bodyText: string) => isWarmupRetryableHttpResponse(status, bodyText));

  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response: Response;

    try {
      response = await fetchOnce();
    } catch (err) {
      if (attempt >= maxAttempts - 1 || !isWarmupRetryableTransportError(err)) {
        throw err;
      }

      options?.onRetry?.({ attemptIndex: attempt, reason: "transport" });
      await delayForWarmupRetry(attempt);
      continue;
    }

    if (response.ok) {
      return response;
    }

    const bodyText = await response.clone().text();

    if (!isRetryableResponse(response.status, bodyText) || attempt >= maxAttempts - 1) {
      return response;
    }

    lastResponse = response;
    options?.onRetry?.({ attemptIndex: attempt, reason: "http", status: response.status });
    await response.body?.cancel();
    await delayForWarmupRetry(attempt);
  }

  if (lastResponse === undefined) {
    throw new Error("fetchWithWarmupRetry exhausted without a response.");
  }

  return lastResponse;
}

/** Thrown when live E2E exhausts retries for transient platform faults (SQL warmup, 503, gateway timeouts). */
export class InfraTransientError extends Error {
  readonly isInfraTransient = true as const;

  constructor(message: string) {
    super(message);
    this.name = "InfraTransientError";
  }
}

export const RETRYABLE_INFRASTRUCTURE_HTTP_STATUSES = new Set([429, 502, 503, 504]);

/** Default infrastructure retry budget for architecture mutations (create / execute / commit). */
export const maxInfrastructureMutationAttempts = 6;

export function isDatabaseUnavailablePayload(body: string): boolean {
  return /database.*unreachable|database unavailable|database_unavailable/i.test(body);
}

export function isRetryableInfrastructureFailure(status: number, body: string): boolean {
  if (RETRYABLE_INFRASTRUCTURE_HTTP_STATUSES.has(status)) {
    return true;
  }

  return isDatabaseUnavailablePayload(body);
}

export function infrastructureRetryDelayMs(attemptIndex: number): number {
  const baseMs = 1000 * 2 ** attemptIndex;
  const cappedMs = Math.min(baseMs, 10_000);
  const jitterMs = Math.floor(Math.random() * 300);

  return cappedMs + jitterMs;
}

export async function delayForInfrastructureRetry(attemptIndex: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, infrastructureRetryDelayMs(attemptIndex)));
}

/**
 * Returns true when the caller should continue the mutation retry loop after backing off.
 * Throws {@link InfraTransientError} when the final infrastructure attempt is exhausted.
 */
export async function continueInfrastructureMutationRetry(
  status: number,
  body: string,
  attemptIndex: number,
  maxAttempts: number,
  operationLabel: string,
): Promise<boolean> {
  if (!isRetryableInfrastructureFailure(status, body)) {
    return false;
  }

  if (attemptIndex >= maxAttempts - 1) {
    throw new InfraTransientError(
      `${operationLabel} failed ${status} after ${maxAttempts} infrastructure retries: ${body.slice(0, 500)}`,
    );
  }

  await delayForInfrastructureRetry(attemptIndex);

  return true;
}

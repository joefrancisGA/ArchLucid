/** Thrown when live E2E exhausts retries for transient platform faults (SQL warmup, 503, gateway timeouts). */
export class InfraTransientError extends Error {
  readonly isInfraTransient = true as const;

  constructor(message: string) {
    super(message);
    this.name = "InfraTransientError";
  }
}

export const RETRYABLE_INFRASTRUCTURE_HTTP_STATUSES = new Set([429, 502, 503, 504]);

const DEFAULT_INFRA_BASE_DELAY_MS = 1000;
const DEFAULT_INFRA_MAX_DELAY_MS = 10_000;
const DEFAULT_INFRA_MAX_ATTEMPTS = 12;
const DEFAULT_INFRA_DB_UNAVAILABLE_MAX_ATTEMPTS = 25;
const DEFAULT_INFRA_WALL_CLOCK_MS = 8 * 60_000;

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();

  if (raw === undefined || raw.length === 0) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

/** Exponential backoff base delay (ms); override with `E2E_INFRA_BASE_DELAY_MS`. */
export function getInfrastructureRetryBaseDelayMs(): number {
  return parsePositiveIntEnv("E2E_INFRA_BASE_DELAY_MS", DEFAULT_INFRA_BASE_DELAY_MS);
}

/** Cap per-attempt infrastructure backoff (ms); override with `E2E_INFRA_MAX_DELAY_MS`. */
export function getInfrastructureRetryMaxDelayMs(): number {
  return parsePositiveIntEnv("E2E_INFRA_MAX_DELAY_MS", DEFAULT_INFRA_MAX_DELAY_MS);
}

/** Default infrastructure retry budget for architecture mutations (create / execute). */
export function getMaxInfrastructureMutationAttempts(): number {
  return parsePositiveIntEnv("E2E_INFRA_MAX_ATTEMPTS", DEFAULT_INFRA_MAX_ATTEMPTS);
}

/**
 * Commit POSTs hit heavier SQL paths than create/execute; align closer to greenfield harness
 * (`ArchitectureRequestConcurrencyTestSupport.PostCommitWithGreenfieldTransientRetryAsync`, 25 attempts).
 */
export function getMaxCommitInfrastructureMutationAttempts(): number {
  return parsePositiveIntEnv("E2E_INFRA_DB_MAX_ATTEMPTS", DEFAULT_INFRA_DB_UNAVAILABLE_MAX_ATTEMPTS);
}

/** Wall-clock budget for a single infrastructure retry sequence; override with `E2E_INFRA_WALL_CLOCK_MS`. */
export function getInfrastructureRetryWallClockMs(): number {
  return parsePositiveIntEnv("E2E_INFRA_WALL_CLOCK_MS", DEFAULT_INFRA_WALL_CLOCK_MS);
}

/** @deprecated Prefer {@link getMaxInfrastructureMutationAttempts} — evaluated at module load for legacy imports. */
export const maxInfrastructureMutationAttempts = getMaxInfrastructureMutationAttempts();

/** @deprecated Prefer {@link getMaxCommitInfrastructureMutationAttempts} — evaluated at module load for legacy imports. */
export const maxCommitInfrastructureMutationAttempts = getMaxCommitInfrastructureMutationAttempts();

export function isDatabaseUnavailablePayload(body: string): boolean {
  return /database.*unreachable|database unavailable|database_unavailable|#database-unavailable|DATABASE_UNAVAILABLE/i.test(
    body,
  );
}

export function isRetryableInfrastructureFailure(status: number, body: string): boolean {
  if (RETRYABLE_INFRASTRUCTURE_HTTP_STATUSES.has(status)) {
    return true;
  }

  return isDatabaseUnavailablePayload(body);
}

export function resolveInfrastructureMutationMaxAttempts(status: number, body: string, requestedMax: number): number {
  if (!isRetryableInfrastructureFailure(status, body)) {
    return requestedMax;
  }

  if (isDatabaseUnavailablePayload(body)) {
    return Math.max(requestedMax, getMaxCommitInfrastructureMutationAttempts());
  }

  return requestedMax;
}

export function infrastructureRetryDelayMs(attemptIndex: number): number {
  const baseMs = getInfrastructureRetryBaseDelayMs() * 2 ** attemptIndex;
  const cappedMs = Math.min(baseMs, getInfrastructureRetryMaxDelayMs());
  const jitterMs = Math.floor(Math.random() * 400);

  return cappedMs + jitterMs;
}

export async function delayForInfrastructureRetry(attemptIndex: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, infrastructureRetryDelayMs(attemptIndex)));
}

export type ContinueInfrastructureMutationRetryOptions = {
  readonly startedAtMs?: number;
};

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
  options?: ContinueInfrastructureMutationRetryOptions,
): Promise<boolean> {
  if (!isRetryableInfrastructureFailure(status, body)) {
    return false;
  }

  const startedAtMs = options?.startedAtMs;

  if (startedAtMs !== undefined && Date.now() - startedAtMs >= getInfrastructureRetryWallClockMs()) {
    throw new InfraTransientError(
      `${operationLabel} infrastructure wall-clock budget exhausted after ${getInfrastructureRetryWallClockMs()}ms: ${body.slice(0, 500)}`,
    );
  }

  const effectiveMaxAttempts = resolveInfrastructureMutationMaxAttempts(status, body, maxAttempts);

  if (attemptIndex >= effectiveMaxAttempts - 1) {
    throw new InfraTransientError(
      `${operationLabel} failed ${status} after ${effectiveMaxAttempts} infrastructure retries: ${body.slice(0, 500)}`,
    );
  }

  await delayForInfrastructureRetry(attemptIndex);

  return true;
}

/** Identity refresh for private-beta `POST /v1/architecture/request` retries. */

const TRAILING_CREATE_SUFFIX = /-\d{10,}-[a-z0-9]+$/i;
const COMMITTED_RUN_ID = /Run '([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})' is committed;/i;

export function isPrivateBetaCreateIdentityConflict(status: number, body: string): boolean {
  if (status === 409 && /already exists in this workspace/i.test(body)) {
    return true;
  }

  // Stale requestId can resolve to an already-committed run; refresh identity and retry.
  if (status === 400 && /is committed; evidence-anchor header columns are immutable/i.test(body)) {
    return true;
  }

  return false;
}

/**
 * The API can persist the run and then report the immutable-header guard from the
 * same request. In that case, the run id in the problem detail is the successful
 * create result and must be reconciled instead of creating another run.
 */
export function parsePrivateBetaCommittedRunId(status: number, body: string): string | null {
  if (status !== 400 || !/evidence-anchor header columns are immutable/i.test(body)) {
    return null;
  }

  return body.match(COMMITTED_RUN_ID)?.[1] ?? null;
}

function stripCreateSuffix(value: string, fallback: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return fallback;
  }

  const stripped = trimmed.replace(TRAILING_CREATE_SUFFIX, "");

  return stripped.length > 0 ? stripped : fallback;
}

/**
 * A failed create can persist the system name (partial findings halt, then 409 on retry).
 * Issue a new request id and system name so the next attempt is not the same collision.
 */
export function refreshPrivateBetaArchitectureCreateBody(
  body: Record<string, unknown>,
  nowMs: number = Date.now(),
  randomSuffix: string = Math.random().toString(36).slice(2, 8),
): Record<string, unknown> {
  const suffix = `${nowMs}-${randomSuffix}`;
  const systemName = stripCreateSuffix(
    typeof body.systemName === "string" ? body.systemName : "",
    "PrivateBetaAccessSmoke",
  );
  const requestId = stripCreateSuffix(
    typeof body.requestId === "string" ? body.requestId : "",
    "E2E-BETA-ACCESS",
  );

  return {
    ...body,
    requestId: `${requestId}-${suffix}`,
    systemName: `${systemName}-${suffix}`,
  };
}

/** Identity refresh for private-beta `POST /v1/architecture/request` retries. */

const TRAILING_CREATE_SUFFIX = /-\d{10,}-[a-z0-9]+$/i;

export function isPrivateBetaCreateIdentityConflict(status: number, body: string): boolean {
  return status === 409 && /already exists in this workspace/i.test(body);
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

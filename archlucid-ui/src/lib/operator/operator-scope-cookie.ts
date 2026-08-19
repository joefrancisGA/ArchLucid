/** Cookie mirror of operator scope IDs so SSR can align with browser `/api/proxy` scope (TB-075 / TB-077). */
export const OPERATOR_SCOPE_COOKIE_NAME = "archlucid_operator_scope_v1";

export type OperatorScopeCookiePayload = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
};

const MAX_ID_LEN = 64;

function isNonEmptyScopeId(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

function sanitizeScopeId(value: string | null | undefined): string | null {
  if (!isNonEmptyScopeId(value)) {
    return null;
  }

  const trimmed = value!.trim();

  if (trimmed.length > MAX_ID_LEN) {
    return null;
  }

  return trimmed;
}

export function operatorScopeCookiePayloadFromHeaders(
  headers: Record<string, string>,
): OperatorScopeCookiePayload | null {
  const tenantId = sanitizeScopeId(headers["x-tenant-id"]);
  const workspaceId = sanitizeScopeId(headers["x-workspace-id"]);
  const projectId = sanitizeScopeId(headers["x-project-id"]);

  if (tenantId === null || workspaceId === null || projectId === null) {
    return null;
  }

  return { tenantId, workspaceId, projectId };
}

export function operatorScopeHeadersFromCookiePayload(
  payload: OperatorScopeCookiePayload,
): Record<string, string> {
  return {
    "x-tenant-id": payload.tenantId,
    "x-workspace-id": payload.workspaceId,
    "x-project-id": payload.projectId,
  };
}

export function parseOperatorScopeCookieValue(raw: string | null | undefined): OperatorScopeCookiePayload | null {
  if (raw === null || raw === undefined || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(raw.trim())) as unknown;

    if (parsed === null || typeof parsed !== "object") {
      return null;
    }

    const row = parsed as Record<string, unknown>;

    return operatorScopeCookiePayloadFromHeaders({
      "x-tenant-id": String(row.tenantId ?? ""),
      "x-workspace-id": String(row.workspaceId ?? ""),
      "x-project-id": String(row.projectId ?? ""),
    });
  } catch {
    return null;
  }
}

export function serializeOperatorScopeCookiePayload(payload: OperatorScopeCookiePayload): string {
  return encodeURIComponent(
    JSON.stringify({
      tenantId: payload.tenantId,
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
    }),
  );
}

/** Browser-only: mirrors effective scope IDs for the next SSR request on navigation. */
export function writeOperatorScopeCookieFromHeaders(headers: Record<string, string>): void {
  if (typeof document === "undefined") {
    return;
  }

  const payload = operatorScopeCookiePayloadFromHeaders(headers);

  if (payload === null) {
    return;
  }

  const maxAgeSec = 60 * 60 * 24 * 30;

  document.cookie = `${OPERATOR_SCOPE_COOKIE_NAME}=${serializeOperatorScopeCookiePayload(payload)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax`;
}

/** Browser-only: clears the SSR scope mirror when operator scope storage is cleared. */
export function clearOperatorScopeCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${OPERATOR_SCOPE_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

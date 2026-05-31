import { decodeJwtPayload } from "@/lib/oidc/jwt-payload";

const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type ProxyBearerScopeHeaders = {
  "x-tenant-id": string;
  "x-workspace-id": string;
  "x-project-id": string;
};

function readGuidClaim(payload: Record<string, unknown>, claimName: string): string | null {
  const raw = payload[claimName];

  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!GUID_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Reads tenant/workspace/project scope from a Bearer JWT payload (display/decode only — API validates signatures).
 */
export function readProxyScopeFromAuthorizationHeader(
  authorization: string | null | undefined,
): ProxyBearerScopeHeaders | null {
  if (authorization === null || authorization === undefined) {
    return null;
  }

  const trimmed = authorization.trim();

  if (!trimmed.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = trimmed.slice("bearer ".length).trim();

  if (token.length === 0) {
    return null;
  }

  const payload = decodeJwtPayload(token);

  if (payload === null) {
    return null;
  }

  const tenantId = readGuidClaim(payload, "tenant_id");
  const workspaceId = readGuidClaim(payload, "workspace_id");
  const projectId = readGuidClaim(payload, "project_id");

  if (tenantId === null || workspaceId === null || projectId === null) {
    return null;
  }

  return {
    "x-tenant-id": tenantId,
    "x-workspace-id": workspaceId,
    "x-project-id": projectId,
  };
}

import {
  DEV_SCOPE_PROJECT_ID,
  DEV_SCOPE_TENANT_ID,
  DEV_SCOPE_WORKSPACE_ID,
  getScopeHeaders,
} from "@/lib/scope";

const SCOPE_HEADER_KEYS = ["x-tenant-id", "x-workspace-id", "x-project-id"] as const;

function readEnvScopeId(name: string): string | null {
  const raw = process.env[name]?.trim() ?? "";

  if (raw.length === 0) {
    return null;
  }

  return raw;
}

/**
 * Production-like proxy posture: browser/localStorage scope headers must not override trusted server scope.
 * Opt-in dev escape hatch: `ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS=true`.
 */
export function isProxyClientScopeForwardingAllowed(): boolean {
  const explicitAllow = (process.env.ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS ?? "").trim().toLowerCase();

  if (explicitAllow === "true" || explicitAllow === "1") {
    return true;
  }

  const trustServerOnly = (process.env.ARCHLUCID_PROXY_TRUST_SERVER_SCOPE_ONLY ?? "").trim().toLowerCase();

  if (trustServerOnly === "true" || trustServerOnly === "1") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

function readTrustedServerScopeHeaders(): Record<string, string> {
  const tenantId = readEnvScopeId("ARCHLUCID_PROXY_TENANT_ID") ?? DEV_SCOPE_TENANT_ID;
  const workspaceId = readEnvScopeId("ARCHLUCID_PROXY_WORKSPACE_ID") ?? DEV_SCOPE_WORKSPACE_ID;
  const projectId = readEnvScopeId("ARCHLUCID_PROXY_PROJECT_ID") ?? DEV_SCOPE_PROJECT_ID;

  return {
    "x-tenant-id": tenantId,
    "x-workspace-id": workspaceId,
    "x-project-id": projectId,
  };
}

/**
 * Resolves upstream scope headers for `/api/proxy` — ignores client scope in production-like posture.
 */
export function resolveProxyUpstreamScopeHeaders(
  incomingHeaders: Headers,
  allowClientScope: boolean = isProxyClientScopeForwardingAllowed(),
): Record<string, string> {
  const trusted = allowClientScope ? getScopeHeaders() : readTrustedServerScopeHeaders();
  const resolved: Record<string, string> = {};

  for (const key of SCOPE_HEADER_KEYS) {
    const incoming = incomingHeaders.get(key);
    const fallback = trusted[key] ?? getScopeHeaders()[key];

    if (allowClientScope && incoming !== null && incoming.trim().length > 0) {
      resolved[key] = incoming.trim();
      continue;
    }

    resolved[key] = fallback;
  }

  return resolved;
}

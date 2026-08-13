/** Request-header builders for live-API E2E: auth headers, tenant scope, and idempotency keys. */
import { getLiveJwtTokenFromEnvSync } from "./jwt-token-provider";
import { readLiveAdminApiKeyFromEnv, resolveLiveAuthMode, resolveLiveJwtMode } from "./live-api-auth";

/** Scope headers for mutating/reading architecture + tenant routes in a specific tenant (self-service registration E2E). */
export type LiveTenantScopeHeaders = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
};

/** Builds `x-tenant-id` / `x-workspace-id` / `x-project-id` headers for {@link LiveTenantScopeHeaders}. */
export function liveTenantScopeHeaders(scope: LiveTenantScopeHeaders): Record<string, string> {
  return {
    "x-tenant-id": scope.tenantId.trim(),
    "x-workspace-id": scope.workspaceId.trim(),
    "x-project-id": scope.projectId.trim(),
  };
}

/**
 * Fresh, isolated tenant/workspace/project scope so this spec's real-run commits cannot trigger a
 * tenant-wide sample-run purge (`SampleRunPurgeForTenant`) against the shared demo tenant
 * (`ScopeIds.DefaultTenant`) that pinned Workspace A/B fixtures live in — see
 * `.cursor/prompts/fix-ci-run-2526-live-api-extended-shard2-sample-purge.md`. `DevelopmentBypass`
 * honors these headers (`ArchLucidAuth:AllowTestActorHeaders`) and dev/CI defaults to
 * `SqlTopologyMode.SingleCatalog`. Architecture run lifecycles do not require a pre-existing
 * `dbo.Tenants` row; governance approval submit (and other `FK_*_Tenants` tables) does — the API
 * idempotently primes the parent row on submit. Isolation still avoids sample-purge contamination.
 */
export function freshIsolatedTenantScope(): LiveTenantScopeHeaders {
  const id = crypto.randomUUID();

  return { tenantId: id, workspaceId: id, projectId: id };
}

/** Fresh idempotency key for persisted governance mutations (`Guid.NewGuid().ToString("N")` parity). */
export function freshLiveE2eIdempotencyKey(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * `x-tenant-id` overrides are only safe under `DevelopmentBypass` (`AllowTestActorHeaders`). Under
 * `ApiKey` mode the CI keys must carry `Authentication:ApiKey:TenantId` claims (see `ui-e2e-live-apikey`
 * in `ci.yml`); unbound keys still reject `x-tenant-id` via `ScopeIdentityBindingMiddleware`. Server RSC
 * `ScopeIdentityBindingMiddleware` returns **403 Forbidden** for any `x-tenant-id` header on a
 * claims-less key; under `JWT` mode scope is resolved from token claims and the header is ignored
 * anyway. Gate here (not per call-site) so every helper can unconditionally accept a
 * `tenantScope` and stay safe when the same spec file is shared across auth-mode CI jobs — see
 * `.cursor/prompts/fix-ci-run-28828296262-live-api-extended-shard3-sample-purge.md` Step 0.
 */
export function mergeTenantScope(
  headers: Record<string, string>,
  tenantScope?: LiveTenantScopeHeaders | null,
): Record<string, string> {

  if (
    tenantScope === undefined ||
    tenantScope === null ||
    tenantScope.tenantId.trim().length === 0 ||
    tenantScope.workspaceId.trim().length === 0 ||
    tenantScope.projectId.trim().length === 0 ||
    resolveLiveAuthMode() !== "bypass"
  ) {
    return headers;
  }

  return { ...headers, ...liveTenantScopeHeaders(tenantScope) };
}

function pickApiKey(explicitApiKey?: string | null): string | undefined {

  if (explicitApiKey !== undefined && explicitApiKey !== null) {
    const trimmed = explicitApiKey.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  const fromEnv = readLiveAdminApiKeyFromEnv();

  return fromEnv.length > 0 ? fromEnv : undefined;
}

/**
 * Builds auth headers. Pass explicit `""` to force **no** `Authorization` / `X-Api-Key` (negative tests).
 * For JWT, optional `explicitBearerToken` overrides env token when non-empty (e.g. invalid token tests).
 */
function pickAuthHeaders(
  explicitApiKey?: string | null,
  explicitBearerToken?: string | null,
): Record<string, string> {

  if (explicitApiKey !== undefined && explicitApiKey !== null && explicitApiKey.trim().length === 0) {
    return {};
  }

  if (explicitBearerToken !== undefined && explicitBearerToken !== null && explicitBearerToken.trim().length === 0) {
    return {};
  }

  if (resolveLiveJwtMode()) {
    const token =
      explicitBearerToken !== undefined && explicitBearerToken !== null && explicitBearerToken.trim().length > 0
        ? explicitBearerToken.trim()
        : getLiveJwtTokenFromEnvSync();

    if (token.length === 0) {
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  }

  const key = pickApiKey(explicitApiKey);

  if (key === undefined) {
    return {};
  }

  return { "X-Api-Key": key };
}

/** JSON request headers. Pass `""` to force **no** auth (negative tests). Omit argument for default credentials. */
export function liveJsonHeaders(
  explicitApiKey?: string | null,
  explicitBearerToken?: string | null,
): Record<string, string> {
  return {
    ...pickAuthHeaders(explicitApiKey, explicitBearerToken),
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/** JSON headers for persisted governance POST routes (`Idempotency-Key` required when `dryRun=false`). */
export function liveGovernanceMutationJsonHeaders(options?: {
  readonly apiKey?: string | null;
  readonly idempotencyKey?: string;
}): Record<string, string> {
  const idempotencyKey = options?.idempotencyKey?.trim() || freshLiveE2eIdempotencyKey();

  if (idempotencyKey.length === 0) {
    throw new Error("Governance mutation requires a non-empty Idempotency-Key header.");
  }

  return {
    ...liveJsonHeaders(options?.apiKey),
    "Idempotency-Key": idempotencyKey,
  };
}

/** GET JSON headers. Pass `""` to omit auth. */
export function liveAcceptHeaders(explicitApiKey?: string | null): Record<string, string> {
  return {
    ...pickAuthHeaders(explicitApiKey),
    Accept: "application/json",
  };
}

/**
 * GET JSON headers with explicit Bearer token (JWT mode). Pass `""` for no `Authorization` header.
 * Use for invalid-token negative tests; ApiKey mode ignores `token` and uses the key path.
 */
export function liveBearerAcceptHeaders(token?: string | null): Record<string, string> {
  return {
    ...pickAuthHeaders(undefined, token),
    Accept: "application/json",
  };
}

/** Auth headers with a caller-chosen `Accept` for binary downloads (zip, docx, pdf). */
export function liveBinaryAcceptHeaders(accept: string, explicitApiKey?: string | null): Record<string, string> {
  return {
    ...pickAuthHeaders(explicitApiKey),
    Accept: accept,
  };
}

/** Headers for non-production `POST /v1/e2e/*` harness routes (must match `ArchLucid:E2eHarness:SharedSecret` on the API). */
export function liveE2eHarnessHeaders(): Record<string, string> {
  const secret = process.env.LIVE_E2E_HARNESS_SECRET?.trim() ?? "";

  if (secret.length < 16) {
    throw new Error("LIVE_E2E_HARNESS_SECRET must be set to >= 16 chars for harness calls.");
  }

  return {
    "X-ArchLucid-E2e-Harness-Secret": secret,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

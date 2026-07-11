/**
 * Typed helpers for Playwright live-API E2E against ArchLucid.Api
 * (`live-api-journey.spec.ts`, `live-api-conflict-journey.spec.ts`, `live-api-governance-rejection.spec.ts`, …).
 *
 * Auth lanes (see `docs/LIVE_E2E_AUTH_ASSUMPTIONS.md`):
 * - **JWT:** `LIVE_JWT_TOKEN` → `Authorization: Bearer …` (takes precedence over API key when both are set).
 * - **ApiKey:** `LIVE_API_KEY` → `X-Api-Key`.
 * - **DevelopmentBypass:** no auth headers.
 */
import type { APIRequestContext, APIResponse } from "@playwright/test";

import {
  continueInfrastructureMutationRetry,
  getMaxCommitInfrastructureMutationAttempts,
  getMaxInfrastructureMutationAttempts,
  InfraTransientError,
} from "./live-api-infra-retry";
import { getLiveJwtTokenFromEnvSync, isLiveJwtTokenConfigured } from "./jwt-token-provider";

export { InfraTransientError } from "./live-api-infra-retry";

/** Base URL for ArchLucid.Api (e.g. http://127.0.0.1:5128), resolved when read (supports late env injection). */
export function resolveLiveApiBase(): string {
  const raw = process.env.LIVE_API_URL ?? "http://127.0.0.1:5128";

  return raw.trim().replace(/\/+$/, "");
}

/** @deprecated Prefer calling {@link resolveLiveApiBase}; kept for `${liveApiBase}/…` in specs. */
export const liveApiBase = resolveLiveApiBase();

/** True when `LIVE_JWT_TOKEN` is non-empty (call at use site — JWT lane can change between module load and test run). */
export function resolveLiveJwtMode(): boolean {
  return isLiveJwtTokenConfigured();
}

/** True when `LIVE_API_KEY` is set and JWT is not configured (see {@link resolveLiveJwtMode}). */
export function resolveLiveApiKeyMode(): boolean {
  return readLiveAdminApiKeyFromEnv().length > 0 && !resolveLiveJwtMode();
}

/** Detected primary auth lane for logging / assertions in specs. */
export type LiveAuthMode = "bypass" | "apikey" | "jwt";

export function resolveLiveAuthMode(): LiveAuthMode {
  if (resolveLiveJwtMode()) {
    return "jwt";
  }

  if (readLiveAdminApiKeyFromEnv().length > 0) {
    return "apikey";
  }

  return "bypass";
}

function readLiveAdminApiKeyFromEnv(): string {
  return process.env.LIVE_API_KEY?.trim() ?? "";
}

/** Optional second key for readonly / least-privilege tests (`live-api-apikey-auth.spec.ts`). */
export function resolveLiveApiKeyReadOnly(): string {
  return process.env.LIVE_API_KEY_READONLY?.trim() ?? "";
}

/**
 * Governance submitter identity for segregation: DevelopmentBypass **Developer**, ApiKey **ApiKeyAdmin**,
 * JWT **LIVE_JWT_ACTOR_NAME** (default **JwtE2eAdmin**) — must match JWT `name` claim.
 */
export function resolveLiveAuthActorName(): string {
  if (resolveLiveJwtMode()) {
    return process.env.LIVE_JWT_ACTOR_NAME?.trim() || "JwtE2eAdmin";
  }

  if (resolveLiveApiKeyMode()) {
    return "ApiKeyAdmin";
  }

  return "Developer";
}

/** Distinct `reviewedBy` body value vs {@link resolveLiveAuthActorName} for approve/reject paths. */
export const livePeerReviewerActorName = "e2e-peer-reviewer";

/** Dev bypass default (`ArchLucidAuth:DevUserId` in appsettings). */
export const liveBypassDefaultActorId = "dev-user";

/** Stable peer reviewer actor key for segregation-of-duties E2E (distinct from {@link liveBypassDefaultActorId}). */
export const livePeerReviewerActorId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

/** E2E governance rejector actor (distinct from default bypass submitter). */
export const liveE2eRejectorActorName = "e2e-rejector";

/** Stable rejector actor key paired with {@link liveE2eRejectorActorName}. */
export const liveE2eRejectorActorId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

const LIVE_E2E_GOVERNANCE_REVIEWER_ACTOR_IDS: Readonly<Record<string, string>> = {
  [livePeerReviewerActorName]: livePeerReviewerActorId,
  "e2e-concurrent-approver-a": "cccccccc-cccc-cccc-cccc-ccccccccccca",
  "e2e-concurrent-approver-b": "cccccccc-cccc-cccc-cccc-cccccccccccb",
  [liveE2eRejectorActorName]: liveE2eRejectorActorId,
};

/**
 * `X-ArchLucid-Test-Actor-*` headers for DevelopmentBypass (`AllowTestActorHeaders`).
 * Governance approve/reject resolves the actor from auth — body `reviewedBy` alone does not change the actor.
 */
export function liveTestActorHeaders(
  actorName: string,
  actorId?: string | null,
): Record<string, string> {
  if (resolveLiveAuthMode() !== "bypass") {
    return {};
  }

  const name = actorName.trim();

  if (name.length === 0) {
    return {};
  }

  const explicitId = actorId?.trim() ?? "";
  const resolvedId =
    explicitId.length > 0
      ? explicitId
      : LIVE_E2E_GOVERNANCE_REVIEWER_ACTOR_IDS[name] ??
        (name === resolveLiveAuthActorName() ? liveBypassDefaultActorId : "");

  if (resolvedId.length === 0) {
    throw new Error(
      `liveTestActorHeaders: unknown reviewer "${name}" in bypass mode — pass actorId or add a stable mapping.`,
    );
  }

  return {
    "X-ArchLucid-Test-Actor-Name": name,
    "X-ArchLucid-Test-Actor-Id": resolvedId,
  };
}

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
 * `ApiKey` mode the CI keys carry no `Authentication:ApiKey:TenantId` claim, so
 * `ScopeIdentityBindingMiddleware` returns **403 Forbidden** for any `x-tenant-id` header on a
 * claims-less key; under `JWT` mode scope is resolved from token claims and the header is ignored
 * anyway. Gate here (not per call-site) so every helper below can unconditionally accept a
 * `tenantScope` and stay safe when the same spec file is shared across auth-mode CI jobs — see
 * `.cursor/prompts/fix-ci-run-28828296262-live-api-extended-shard3-sample-purge.md` Step 0.
 */
function mergeTenantScope(
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

/**
 * Compares run ids across API surfaces: architecture routes use 32-char hex (`Guid.ToString("N")`),
 * while authority run detail JSON serializes `Guid` with hyphens. The operator UI shows the authority value.
 */
export function normalizeRunIdForCompare(value: string): string {
  return value.replace(/-/g, "").trim().toLowerCase();
}

/** Unwraps `CursorPagedResponse` (`items` / legacy bare array) for live API list endpoints. */
export function unwrapCursorPagedResponseItems<T>(body: unknown): T[] {
  if (Array.isArray(body)) {
    return body;
  }

  if (body !== null && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const items = record.items ?? record.Items;

    if (Array.isArray(items)) {
      return items as T[];
    }
  }

  return [];
}

/** Matches LlmSemanticAdmissionGate architecture-domain heuristic (see ArchLucid.Application). */
const liveE2eArchitectureAdmissionRegex =
  /\b(architecture|system|database|api|service|cloud|azure|aws|gcp|security|compliance|tenant|scale|latency|throughput|auth|identity)\b/i;

/**
 * Builds a POST `/v1/architecture/request` description that passes semantic admission.
 * Prefix with test-specific intent; appends architecture vocabulary when the intent alone would be rejected.
 */
export function liveE2eArchitectureDescription(testIntent: string): string {
  const intent = testIntent.trim();

  if (liveE2eArchitectureAdmissionRegex.test(intent)) {
    return intent;
  }

  return `${intent} Secure Azure API service architecture with SQL database, managed identity auth, and cloud compliance constraints.`;
}

function resolveArchitectureDescriptionField(description: unknown, fallbackIntent: string): string {
  if (typeof description === "function") {
    return (description as (intent: string) => string)(fallbackIntent);
  }

  if (typeof description === "string") {
    return description.trim();
  }

  return "";
}

/**
 * Enriches POST `/v1/architecture/request` bodies so thin descriptions or specs that pass
 * {@link liveE2eArchitectureDescription} by reference pass semantic admission in ApiKey/JWT lanes.
 */
export function enrichArchitectureRequestBody(body: Record<string, unknown>): Record<string, unknown> {
  const intent =
    typeof body.systemName === "string" && body.systemName.trim().length > 0
      ? body.systemName.trim()
      : "Live E2E architecture request";

  const description = resolveArchitectureDescriptionField(body.description, intent);

  if (liveE2eArchitectureAdmissionRegex.test(description)) {
    return { ...body, description };
  }

  const suffix = description.length > 0 ? ` Context: ${description}` : "";

  return {
    ...body,
    description: liveE2eArchitectureDescription(intent) + suffix,
  };
}

function pickApiKey(explicitApiKey?: string | null): string | undefined {
  if (explicitApiKey !== undefined && explicitApiKey !== null) {
    const t = explicitApiKey.trim();

    return t.length > 0 ? t : undefined;
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
export function liveJsonHeaders(explicitApiKey?: string | null): Record<string, string> {
  return {
    ...pickAuthHeaders(explicitApiKey),
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
 * Use for invalid-token negative tests; ApiKey mode ignores `token` and uses {@link pickAuthHeaders} key path.
 */
export function liveBearerAcceptHeaders(token?: string | null): Record<string, string> {
  return {
    ...pickAuthHeaders(undefined, token),
    Accept: "application/json",
  };
}

function liveBinaryAcceptHeaders(accept: string, explicitApiKey?: string | null): Record<string, string> {
  return {
    ...pickAuthHeaders(explicitApiKey),
    Accept: accept,
  };
}

async function throwIfNotOk(res: APIResponse, label: string): Promise<void> {
  if (res.ok()) {
    return;
  }

  const text = await res.text();
  const snippet = text.slice(0, 500);

  let hint = "";

  if (res.status() === 401 && label.includes("/v1/"))
    hint =
      " Hint: use auth lane matching the API — DevelopmentBypass expects no Bearer/X-Api-Key (omit LIVE_JWT_TOKEN and LIVE_API_KEY); JwtBearer CI needs LIVE_JWT_TOKEN; ApiKey needs LIVE_API_KEY. Confirm LIVE_API_URL points at ArchLucid.Api.";

  throw new Error(`${label} failed ${res.status()}: ${snippet}${hint}`);
}

/** Waits after HTTP 429 using `Retry-After` when present (capped), else a short default. */
async function delayAfterRateLimitedResponse(res: APIResponse): Promise<void> {
  const headers = res.headers();
  const retryAfterRaw = headers["retry-after"] ?? headers["Retry-After"];
  const seconds = retryAfterRaw ? Number.parseInt(String(retryAfterRaw).trim(), 10) : Number.NaN;
  const ms =
    Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 60_000) : 2500;

  await new Promise((r) => setTimeout(r, ms));
}

/** Replays a consumed Playwright response so negative-path callers can still read status/body. */
function replayBufferedApiResponse(status: number, body: string, source: APIResponse): APIResponse {
  const headers = source.headers();

  return {
    ok: () => status >= 200 && status < 300,
    status: () => status,
    statusText: () => source.statusText(),
    headers: () => headers,
    headersArray: () =>
      Object.entries(headers).map(([name, value]) => ({
        name,
        value,
      })),
    text: async () => body,
    json: async () => JSON.parse(body) as unknown,
    body: async () => Buffer.from(body),
    url: () => source.url(),
    [Symbol.asyncDispose]: async () => {},
  };
}

/** POST `/v1/architecture/request` — raw response for negative-path tests (400/422). */
export async function postArchitectureRequestRaw(
  request: APIRequestContext,
  body: unknown,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/architecture/request`, {
    data: body,
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });
}

/** Mutating architecture POSTs share one API with many live specs — retry transient infra before failing journeys. */
function maxArchitectureMutationAttempts(): number {
  return getMaxInfrastructureMutationAttempts();
}

/** Per-attempt HTTP timeout — prevents a wedged commit from burning the whole Playwright test timeout. */
const commitAttemptHttpTimeoutMs = 90_000;

/** Client-side wall-clock budget (mirrors greenfield SQL harness `GreenfieldSqlCommitRetryWallClockBudget`). */
const commitRetryWallClockBudgetMs = 8 * 60_000;

/** Authority commit can return transient 409 (#conflict) immediately after ReadyForCommit poll — retry before failing journeys. */
const maxCommitTransient409Attempts = 25;

function isManifestNotLoadedYetConflict(status: number, body: string): boolean {
  return status === 409 && body.includes("manifest could not be loaded yet");
}

/** Dedicated infrastructure retry budget for commit (503 database warmup, gateway faults). */
function maxCommitInfrastructureAttempts(): number {
  return getMaxCommitInfrastructureMutationAttempts();
}

function isTransientCommitConflict(status: number, body: string): boolean {
  if (status !== 409) {
    return false;
  }

  return (
    body.includes("manifest could not be loaded yet") ||
    body.includes("transient database condition") ||
    body.includes("stale run row version")
  );
}

function throwCommitHttpError(status: number, body: string, runId: string): never {
  const message = `POST /v1/architecture/run/${runId}/commit failed ${status}: ${body.slice(0, 500)}`;

  if (status >= 500 && status < 600) {
    throw new InfraTransientError(message);
  }

  throw new Error(message);
}

async function tryFetchCommittedRunCommitShape(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<CommitRunResponseJson | null> {
  try {
    const detail = await getRunDetailsWithTransientRetries(request, runId, tenantScope);
    const manifestVersion = detail.run?.currentManifestVersion?.trim() ?? "";

    if (isArchitectureRunStatusCommitted(detail.run?.status) && manifestVersion.length > 0) {
      return { manifest: { metadata: { manifestVersion } } };
    }
  } catch {
    // Best-effort idempotent reconcile when POST /commit raced or returned transient 409.
  }

  return null;
}

/** POST `/v1/architecture/request` — create a new architecture run. */
export async function createRun(
  request: APIRequestContext,
  body: Record<string, unknown>,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<{ runId: string }> {
  for (let attempt = 0; attempt < maxArchitectureMutationAttempts(); attempt++) {
    const res = await postArchitectureRequestRaw(request, body, tenantScope);
    const status = res.status();

    if (status === 429 && attempt < maxArchitectureMutationAttempts() - 1) {
      await delayAfterRateLimitedResponse(res);

      continue;
    }

    if (!res.ok()) {
      const responseBody = await res.text();

      if (
        await continueInfrastructureMutationRetry(
          status,
          responseBody,
          attempt,
          maxArchitectureMutationAttempts(),
          "POST /v1/architecture/request",
        )
      ) {
        continue;
      }

      let hint = "";

      if (status === 401) {
        hint =
          " Hint: use auth lane matching the API — DevelopmentBypass expects no Bearer/X-Api-Key (omit LIVE_JWT_TOKEN and LIVE_API_KEY); JwtBearer CI needs LIVE_JWT_TOKEN; ApiKey needs LIVE_API_KEY. Confirm LIVE_API_URL points at ArchLucid.Api.";
      }

      throw new Error(`POST /v1/architecture/request failed ${status}: ${responseBody.slice(0, 500)}${hint}`);
    }

    const created = (await res.json()) as { run?: { runId?: string } };
    const runId = created.run?.runId;

    if (!runId) {
      throw new Error("Create run response missing run.runId");
    }

    return { runId };
  }

  throw new InfraTransientError("createRun: retry loop exhausted");
}

/** POST `/v1/architecture/run/{runId}/execute` — run agents (Simulator in CI). */
export async function executeRun(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<unknown> {
  for (let attempt = 0; attempt < maxArchitectureMutationAttempts(); attempt++) {
    const res = await request.post(`${resolveLiveApiBase()}/v1/architecture/run/${runId}/execute`, {
      headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
    });
    const status = res.status();

    if (status === 429 && attempt < maxArchitectureMutationAttempts() - 1) {
      await delayAfterRateLimitedResponse(res);

      continue;
    }

    if (!res.ok()) {
      const responseBody = await res.text();

      if (
        await continueInfrastructureMutationRetry(
          status,
          responseBody,
          attempt,
          maxArchitectureMutationAttempts(),
          `POST /v1/architecture/run/${runId}/execute`,
        )
      ) {
        continue;
      }

      throw new Error(
        `POST /v1/architecture/run/${runId}/execute failed ${status}: ${responseBody.slice(0, 500)}`,
      );
    }

    return res.json();
  }

  throw new InfraTransientError("executeRun: retry loop exhausted");
}

/** POST `/v1/architecture/run/{runId}/commit` — merge and persist golden manifest. */
export async function commitRun(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<CommitRunResponseJson> {
  const retryStartedMs = Date.now();
  let delayMs = 250;
  let consecutiveManifestNotLoaded409 = 0;
  let infrastructureAttempt = 0;

  for (let attempt = 0; attempt < maxCommitTransient409Attempts; attempt++) {
    if (Date.now() - retryStartedMs >= commitRetryWallClockBudgetMs) {
      throw new Error(
        `commitRun: wall-clock retry budget exhausted after ${commitRetryWallClockBudgetMs}ms for run ${runId}`,
      );
    }

    const alreadyCommitted = await tryFetchCommittedRunCommitShape(request, runId, tenantScope);

    if (alreadyCommitted !== null) {
      return alreadyCommitted;
    }

    const res = await request.post(`${resolveLiveApiBase()}/v1/architecture/run/${runId}/commit`, {
      headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
      timeout: commitAttemptHttpTimeoutMs,
    });

    if (res.ok()) {
      await waitForRunDetailCommitted(request, runId, 60_000, tenantScope);

      return res.json() as Promise<CommitRunResponseJson>;
    }

    const body = await res.text();
    const status = res.status();

    if (status === 429 && attempt < maxCommitTransient409Attempts - 1) {
      await delayAfterRateLimitedResponse(res);

      continue;
    }

    if (
      await continueInfrastructureMutationRetry(
        status,
        body,
        infrastructureAttempt,
        maxCommitInfrastructureAttempts(),
        `POST /v1/architecture/run/${runId}/commit`,
        { startedAtMs: retryStartedMs },
      )
    ) {
      infrastructureAttempt += 1;

      continue;
    }

    if (isTransientCommitConflict(status, body) && attempt < maxCommitTransient409Attempts - 1) {
      if (isManifestNotLoadedYetConflict(status, body)) {
        consecutiveManifestNotLoaded409 += 1;

        if (consecutiveManifestNotLoaded409 >= 3) {
          await waitForReadyForCommit(request, runId, 30_000, tenantScope);
        }
      } else {
        consecutiveManifestNotLoaded409 = 0;
      }

      await new Promise((r) => setTimeout(r, delayMs));
      delayMs = Math.min(delayMs * 2, 8000);

      continue;
    }

    throwCommitHttpError(status, body, runId);
  }

  throw new InfraTransientError(`commitRun: retry loop exhausted for run ${runId}`);
}

/**
 * Same as {@link commitRun} but returns the raw response for negative-path assertions (409, 404, …).
 * Retries **429** / transient infrastructure (**502** / **503** / **504**, database-unavailable payloads) only
 * so callers still see the first definitive 4xx (e.g. 404) body.
 */
export async function commitRunRaw(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  const retryStartedMs = Date.now();
  let infrastructureAttempt = 0;

  for (let attempt = 0; attempt < maxCommitTransient409Attempts; attempt++) {
    if (Date.now() - retryStartedMs >= commitRetryWallClockBudgetMs) {
      throw new InfraTransientError(
        `commitRunRaw: wall-clock retry budget exhausted after ${commitRetryWallClockBudgetMs}ms for run ${runId}`,
      );
    }

    const res = await request.post(`${resolveLiveApiBase()}/v1/architecture/run/${runId}/commit`, {
      headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
      timeout: commitAttemptHttpTimeoutMs,
    });
    const status = res.status();

    if (status === 429 && attempt < maxCommitTransient409Attempts - 1) {
      await delayAfterRateLimitedResponse(res);

      continue;
    }

    if (!res.ok()) {
      const responseBody = await res.text();

      if (
        await continueInfrastructureMutationRetry(
          status,
          responseBody,
          infrastructureAttempt,
          maxCommitInfrastructureAttempts(),
          `POST /v1/architecture/run/${runId}/commit`,
          { startedAtMs: retryStartedMs },
        )
      ) {
        infrastructureAttempt += 1;

        continue;
      }

      return replayBufferedApiResponse(status, responseBody, res);
    }

    return res;
  }

  throw new InfraTransientError("commitRunRaw: retry loop exhausted");
}

/** Minimal commit response shape for E2E (camelCase JSON). */
export type CommitRunResponseJson = {
  manifest?: {
    metadata?: { manifestVersion?: string };
  };
};

/** GET `/v1/architecture/run/{runId}` — raw response (404/409 negative paths). */
export async function getRunDetailsRaw(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.get(`${resolveLiveApiBase()}/v1/architecture/run/${runId}`, {
    headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
  });
}

/** GET `/v1/authority/runs/{runId}` — scoped authority aggregate incl. findings snapshot (demo workspace smoke counts). */
export async function getAuthorityRunDetailRaw(
  request: APIRequestContext,
  runId: string,
  tenantScope: LiveTenantScopeHeaders,
  options?: { apiKey?: string | null },
): Promise<APIResponse> {
  const encoded = encodeURIComponent(runId);

  return request.get(`${resolveLiveApiBase()}/v1/authority/runs/${encoded}`, {
    headers: mergeTenantScope(liveAcceptHeaders(options?.apiKey), tenantScope),
  });
}

const maxTransientHttpPollAttempts = 24;

async function sleepTransientHttpBackoff(attempt: number): Promise<void> {
  const baseDelayMs = Math.min(1000 * 2 ** attempt, 8000);
  const jitterMs = Math.floor(Math.random() * 250);

  await new Promise((resolve) => setTimeout(resolve, baseDelayMs + jitterMs));
}

function isTransientHttpStatus(code: number): boolean {
  return code === 429 || (code >= 500 && code < 600);
}

function isTransientLiveApiTransportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return /ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|request context.*disposed|Failed to connect|Connection refused|network error/i.test(
    message,
  );
}

/** CI live API + SQL commit convergence needs more wall clock than local runs. */
export function liveE2eCommitWaitMs(requestedMs = 90_000): number {
  if (process.env.CI && requestedMs <= 90_000) {
    return 180_000;
  }

  return requestedMs;
}

/**
 * Playwright per-test timeout for specs that run create → execute → commit (and often governance) via API.
 * Budgets two {@link liveE2eCommitWaitMs} polls (each up to 180s in CI) plus commit retries and UI steps.
 */
export function liveE2eArchitectureRunCyclePlaywrightTimeoutMs(): number {
  return process.env.CI ? 600_000 : 300_000;
}

/** Playwright per-test timeout for lighter live API contract probes (no full architecture run cycle). */
export function liveE2eApiContractPlaywrightTimeoutMs(): number {
  return process.env.CI ? 120_000 : 60_000;
}

/**
 * Polls GET /health/ready until success — tolerates brief API process startup and transport blips in CI.
 */
export async function waitForLiveApiReady(
  request: APIRequestContext,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? liveE2eCommitWaitMs(90_000);
  const deadline = Date.now() + timeoutMs;
  let lastError = "unknown";

  while (Date.now() < deadline) {
    try {
      const res = await request.get(`${resolveLiveApiBase()}/health/ready`, { timeout: 20_000 });

      if (res.ok()) {
        return;
      }

      lastError = `status ${res.status()}: ${(await res.text()).slice(0, 300)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(
    `Live API not ready at ${resolveLiveApiBase()}/health/ready within ${timeoutMs}ms. Last: ${lastError}`,
  );
}

/** GET a live API path with transient 5xx/429 retries (CI SQL warmup). */
export async function getLiveApiPathWithTransientRetries(
  request: APIRequestContext,
  apiPath: string,
  options?: {
    readonly headers?: Record<string, string>;
    readonly timeout?: number;
  },
): Promise<APIResponse> {
  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  const headers = options?.headers ?? liveAcceptHeaders();
  let lastResponse: APIResponse | undefined;

  for (let attempt = 0; attempt < maxTransientHttpPollAttempts; attempt++) {
    try {
      lastResponse = await request.get(`${resolveLiveApiBase()}${path}`, {
        headers,
        timeout: options?.timeout ?? 60_000,
      });
    } catch (error) {
      if (isTransientLiveApiTransportError(error) && attempt < maxTransientHttpPollAttempts - 1) {
        await sleepTransientHttpBackoff(attempt);

        continue;
      }

      throw error;
    }

    const code = lastResponse.status();

    if (lastResponse.ok()) {
      return lastResponse;
    }

    if (code === 429 && attempt < maxTransientHttpPollAttempts - 1) {
      await delayAfterRateLimitedResponse(lastResponse);

      continue;
    }

    if (isTransientHttpStatus(code) && attempt < maxTransientHttpPollAttempts - 1) {
      await sleepTransientHttpBackoff(attempt);

      continue;
    }

    return lastResponse;
  }

  return lastResponse!;
}

/**
 * Same as {@link getAuthorityRunDetailRaw} but retries on HTTP 5xx (transient API/SQL) and 429 during CI seed probes.
 */
export async function getAuthorityRunDetailWithTransientRetries(
  request: APIRequestContext,
  runId: string,
  tenantScope: LiveTenantScopeHeaders,
  options?: { apiKey?: string | null },
): Promise<APIResponse> {
  let lastResponse: APIResponse | undefined;

  for (let attempt = 0; attempt < maxTransientHttpPollAttempts; attempt++) {
    try {
      lastResponse = await getAuthorityRunDetailRaw(request, runId, tenantScope, options);
    } catch (error) {
      if (isTransientLiveApiTransportError(error) && attempt < maxTransientHttpPollAttempts - 1) {
        await sleepTransientHttpBackoff(attempt);

        continue;
      }

      throw error;
    }

    const code = lastResponse.status();

    if (lastResponse.ok()) {
      return lastResponse;
    }

    if (code === 429 && attempt < maxTransientHttpPollAttempts - 1) {
      await delayAfterRateLimitedResponse(lastResponse);

      continue;
    }

    if (isTransientHttpStatus(code) && attempt < maxTransientHttpPollAttempts - 1) {
      await sleepTransientHttpBackoff(attempt);

      continue;
    }

    return lastResponse;
  }

  return lastResponse!;
}

/** GET `/v1/pilots/runs/{runId}/pilot-run-deltas` — proof-of-ROI numbers for the run (see `docs/library/API_CONTRACTS.md`). */
export async function getPilotRunDeltasRaw(
  request: APIRequestContext,
  runId: string,
  tenantScope: LiveTenantScopeHeaders,
  options?: { apiKey?: string | null },
): Promise<APIResponse> {
  const encoded = encodeURIComponent(runId);

  return request.get(`${resolveLiveApiBase()}/v1/pilots/runs/${encoded}/pilot-run-deltas`, {
    headers: mergeTenantScope(liveAcceptHeaders(options?.apiKey), tenantScope),
  });
}

const maxPilotRunDeltasPollAttempts = maxTransientHttpPollAttempts;

/**
 * Same as {@link getPilotRunDeltasRaw} but retries on HTTP 5xx (transient API/SQL) and 429 during CI seed probes.
 */
export async function getPilotRunDeltasWithTransientRetries(
  request: APIRequestContext,
  runId: string,
  tenantScope: LiveTenantScopeHeaders,
  options?: { apiKey?: string | null },
): Promise<APIResponse> {
  let lastResponse: APIResponse | undefined;

  for (let attempt = 0; attempt < maxPilotRunDeltasPollAttempts; attempt++) {
    lastResponse = await getPilotRunDeltasRaw(request, runId, tenantScope, options);
    const code = lastResponse.status();

    if (lastResponse.ok()) {
      return lastResponse;
    }

    if (code === 429 && attempt < maxPilotRunDeltasPollAttempts - 1) {
      await delayAfterRateLimitedResponse(lastResponse);

      continue;
    }

    if (isTransientHttpStatus(code) && attempt < maxPilotRunDeltasPollAttempts - 1) {
      await sleepTransientHttpBackoff(attempt);

      continue;
    }

    return lastResponse;
  }

  return lastResponse!;
}

/** Counts sealed findings on `findingsSnapshot.findings` from {@link getAuthorityRunDetailRaw} JSON (camelCase wire shape). */
export function countFindingsInAuthorityRunDetailPayload(payload: unknown): number {
  if (payload === null || typeof payload !== "object") {
    return 0;
  }

  const root = payload as Record<string, unknown>;
  const snapshot = root.findingsSnapshot;

  if (snapshot === null || typeof snapshot !== "object") {
    return 0;
  }

  const findings = (snapshot as Record<string, unknown>).findings;

  return Array.isArray(findings) ? findings.length : 0;
}

/** GET `/v1/architecture/run/{runId}` — run aggregate including golden manifest id after commit. */
export async function getRunDetails(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<RunDetailsJson> {
  const res = await getRunDetailsRaw(request, runId, tenantScope);

  await throwIfNotOk(res, "GET /v1/architecture/run/...");

  return res.json() as Promise<RunDetailsJson>;
}

/** Polling must survive transient 5xx and fixed-window 429 when many live specs share one API process. */
const maxRunDetailPollAttempts = 16;

/**
 * Same as {@link getRunDetails} but retries on HTTP 5xx (transient API/SQL) and 429 (rate limit) during polling.
 */
export async function getRunDetailsWithTransientRetries(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<RunDetailsJson> {
  for (let attempt = 0; attempt < maxRunDetailPollAttempts; attempt++) {
    try {
      const res = await request.get(`${resolveLiveApiBase()}/v1/architecture/run/${runId}`, {
        headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
      });
      const code = res.status();

      if (code === 429 && attempt < maxRunDetailPollAttempts - 1) {
        await delayAfterRateLimitedResponse(res);

        continue;
      }

      if (code >= 500 && code < 600 && attempt < maxRunDetailPollAttempts - 1) {
        await new Promise((r) => setTimeout(r, 500));

        continue;
      }

      await throwIfNotOk(res, "GET /v1/architecture/run/...");

      return res.json() as Promise<RunDetailsJson>;
    } catch (error) {
      if (isTransientLiveApiTransportError(error) && attempt < maxRunDetailPollAttempts - 1) {
        await sleepTransientHttpBackoff(attempt);

        continue;
      }

      throw error;
    }
  }

  throw new Error("getRunDetailsWithTransientRetries: retry loop exhausted");
}

/**
 * Polls GET run detail until status is ReadyForCommit (4), Committed (5), or timeout.
 * Throws if the run reaches Failed (6) first.
 */
export async function waitForReadyForCommit(
  request: APIRequestContext,
  runId: string,
  timeoutMs = 90_000,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<void> {
  const deadline = Date.now() + liveE2eCommitWaitMs(timeoutMs);

  while (Date.now() < deadline) {
    const detail = await getRunDetailsWithTransientRetries(request, runId, tenantScope);
    const status = detail.run?.status;

    const resultsCount = Array.isArray(detail.results) ? detail.results.length : 0;

    if (status === 4 || status === "ReadyForCommit") {
      if (resultsCount > 0) {
        return;
      }
    }

    if (status === 5 || status === "Committed") {
      return;
    }

    if (status === 6 || status === "Failed") {
      throw new Error(`Run ${runId} reached Failed before ReadyForCommit`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error(`Run ${runId} did not reach ReadyForCommit within ${liveE2eCommitWaitMs(timeoutMs)}ms`);
}

/** Row from `GET /v1/architecture/runs` (coordinator list). */
export type ArchitectureRunListItemJson = {
  runId?: string;
  status?: string;
  requestId?: string;
  currentManifestVersion?: string | null;
  systemName?: string | null;
};

/** Converts a 32-char hex run id to hyphenated GUID for API routes that use `{runId:guid}`. */
export function toRunGuidPathSegment(runId: string): string {
  const n = runId.trim();

  if (n.includes("-")) {
    return n;
  }

  if (n.length === 32 && /^[0-9a-fA-F]+$/.test(n)) {
    return `${n.slice(0, 8)}-${n.slice(8, 12)}-${n.slice(12, 16)}-${n.slice(16, 20)}-${n.slice(20)}`;
  }

  return n;
}

/** True when API status is {@link ArchitectureRunStatus.Committed} (numeric 5 or string "Committed"). */
export function isArchitectureRunStatusCommitted(status: number | string | undefined): boolean {
  if (status === undefined || status === null) {
    return false;
  }

  if (typeof status === "number") {
    return status === 5;
  }

  return /^committed$/i.test(String(status).trim());
}

/** Polls GET run detail until status is Committed or timeout (post-commit / read-your-writes). */
export async function waitForRunDetailCommitted(
  request: APIRequestContext,
  runId: string,
  timeoutMs = 90_000,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<void> {
  const deadline = Date.now() + liveE2eCommitWaitMs(timeoutMs);

  while (Date.now() < deadline) {
    const detail = await getRunDetailsWithTransientRetries(request, runId, tenantScope);

    if (isArchitectureRunStatusCommitted(detail.run?.status)) {
      return;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(
    `Run ${runId} did not reach Committed (GET /v1/architecture/run/{id}) within ${liveE2eCommitWaitMs(timeoutMs)}ms`,
  );
}

/** Polls authority run summary until visible in scope (compare reads dbo.Runs via the same projection). */
export async function waitForAuthorityRunSummaryReady(
  request: APIRequestContext,
  runId: string,
  timeoutMs = 90_000,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<void> {
  const deadline = Date.now() + liveE2eCommitWaitMs(timeoutMs);
  const encoded = encodeURIComponent(runId);

  while (Date.now() < deadline) {
    const res = await request.get(`${resolveLiveApiBase()}/v1/authority/runs/${encoded}/summary`, {
      headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
    });

    if (res.ok()) {
      return;
    }

    if (res.status() !== 404) {
      await throwIfNotOk(res, `GET /v1/authority/runs/${encoded}/summary`);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(
    `Authority run summary for ${runId} not ready (GET /v1/authority/runs/{id}/summary) within ${liveE2eCommitWaitMs(timeoutMs)}ms`,
  );
}

/** Polls GET /v1/architecture/runs until the row shows Committed or timeout (dashboard list consistency). */
export async function waitForArchitectureRunListCommitted(
  request: APIRequestContext,
  runId: string,
  timeoutMs = 90_000,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<void> {
  const deadline = Date.now() + liveE2eCommitWaitMs(timeoutMs);

  while (Date.now() < deadline) {
    const rows = await listArchitectureRuns(request, tenantScope);
    const row = rows.find((r) => r.runId === runId);

    if (row !== undefined && isArchitectureRunStatusCommitted(row.status)) {
      return;
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  throw new Error(
    `Run ${runId} did not show Committed on GET /v1/architecture/runs within ${liveE2eCommitWaitMs(timeoutMs)}ms`,
  );
}

/** Polls GET /v1/architecture/runs until the run id appears (any pipeline status). */
export async function waitForArchitectureRunListIncludesRun(
  request: APIRequestContext,
  runId: string,
  timeoutMs = 90_000,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<void> {
  const deadline = Date.now() + liveE2eCommitWaitMs(timeoutMs);
  const normalized = normalizeRunIdForCompare(runId);

  while (Date.now() < deadline) {
    const rows = await listArchitectureRuns(request, tenantScope);
    const found = rows.some((row) => normalizeRunIdForCompare(String(row.runId ?? "")) === normalized);

    if (found) {
      return;
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  throw new Error(
    `Run ${runId} did not appear in GET /v1/architecture/runs within ${liveE2eCommitWaitMs(timeoutMs)}ms`,
  );
}

/** GET `/v1/architecture/runs` — recent runs in scope (dashboard / picker). */
export async function listArchitectureRuns(
  request: APIRequestContext,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<ArchitectureRunListItemJson[]> {
  const res = await request.get(`${resolveLiveApiBase()}/v1/architecture/runs`, {
    headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "GET /v1/architecture/runs");

  const body: unknown = await res.json();
  const rows = unwrapCursorPagedResponseItems<ArchitectureRunListItemJson>(body);

  if (!Array.isArray(rows)) {
    throw new Error(
      "GET /v1/architecture/runs returned unexpected JSON (expected array or CursorPagedResponse.items).",
    );
  }

  return rows;
}

export type LiveGovernanceReviewRequestOptions = {
  readonly apiKey?: string | null;
  /** DevelopmentBypass only — maps to `X-ArchLucid-Test-Actor-Id` when set. */
  readonly testActorId?: string | null;
};

/** Bypass-mode peer reviewer options for governance approve/reject (distinct from default submitter). */
export const livePeerReviewerGovernanceOptions: LiveGovernanceReviewRequestOptions = {
  testActorId: livePeerReviewerActorId,
};

/** Bypass-mode submitter options for intentional self-approval negative paths. */
export const liveBypassSubmitterGovernanceOptions: LiveGovernanceReviewRequestOptions = {
  testActorId: liveBypassDefaultActorId,
};

/** Bypass-mode rejector options for governance reject paths. */
export const liveRejectorGovernanceOptions: LiveGovernanceReviewRequestOptions = {
  testActorId: liveE2eRejectorActorId,
};

/** POST approve without throwing — use for negative-path assertions (`expect.soft` + status/body). */
export async function postGovernanceApproveRaw(
  request: APIRequestContext,
  approvalRequestId: string,
  body: { reviewedBy: string; reviewComment?: string | null },
  options?: LiveGovernanceReviewRequestOptions,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/governance/approval-requests/${approvalRequestId}/approve`, {
    data: {
      reviewedBy: body.reviewedBy,
      reviewComment: body.reviewComment ?? null,
    },
    headers: mergeTenantScope(
      {
        ...liveJsonHeaders(options?.apiKey),
        ...liveTestActorHeaders(body.reviewedBy, options?.testActorId),
      },
      tenantScope,
    ),
  });
}

export type RunDetailsJson = {
  run?: {
    goldenManifestId?: string | null;
    currentManifestVersion?: string | null;
    /** Numeric enum from API JSON, or string name when serialized as string. */
    status?: number | string;
  };
  results?: unknown[];
};

/** POST `/v1/governance/approval-requests` — submit promotion approval request. */
export async function createApprovalRequest(
  request: APIRequestContext,
  body: CreateGovernanceApprovalRequestBody,
  tenantScope?: LiveTenantScopeHeaders | null,
  options?: { readonly idempotencyKey?: string },
): Promise<GovernanceApprovalRequestJson> {
  for (let attempt = 0; attempt < maxArchitectureMutationAttempts(); attempt++) {
    const res = await request.post(`${resolveLiveApiBase()}/v1/governance/approval-requests`, {
      data: {
        runId: body.runId,
        manifestVersion: body.manifestVersion,
        sourceEnvironment: body.sourceEnvironment,
        targetEnvironment: body.targetEnvironment,
        requestComment: body.requestComment ?? null,
      },
      headers: mergeTenantScope(
        liveGovernanceMutationJsonHeaders({ idempotencyKey: options?.idempotencyKey }),
        tenantScope,
      ),
    });
    const status = res.status();

    if (status === 429 && attempt < maxArchitectureMutationAttempts() - 1) {
      await delayAfterRateLimitedResponse(res);

      continue;
    }

    if (!res.ok()) {
      const responseBody = await res.text();

      if (
        await continueInfrastructureMutationRetry(
          status,
          responseBody,
          attempt,
          maxArchitectureMutationAttempts(),
          "POST /v1/governance/approval-requests",
        )
      ) {
        continue;
      }

      throw new Error(
        `POST /v1/governance/approval-requests failed ${status}: ${responseBody.slice(0, 500)}`,
      );
    }

    return res.json() as Promise<GovernanceApprovalRequestJson>;
  }

  throw new InfraTransientError("createApprovalRequest: retry loop exhausted");
}

export type CreateGovernanceApprovalRequestBody = {
  runId: string;
  manifestVersion: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  requestComment?: string;
};

export type GovernanceApprovalRequestJson = {
  approvalRequestId?: string;
  status?: string;
  runId?: string;
};

/** POST `/v1/governance/approval-requests/{id}/approve`. Use a different `reviewedBy` than the submitter to satisfy segregation of duties. */
export async function approveGovernanceRequest(
  request: APIRequestContext,
  approvalRequestId: string,
  body: { reviewedBy: string; reviewComment?: string },
  options?: LiveGovernanceReviewRequestOptions,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<GovernanceApprovalRequestJson> {
  const res = await request.post(
    `${resolveLiveApiBase()}/v1/governance/approval-requests/${approvalRequestId}/approve`,
    {
      data: {
        reviewedBy: body.reviewedBy,
        reviewComment: body.reviewComment ?? null,
      },
      headers: mergeTenantScope(
        {
          ...liveJsonHeaders(options?.apiKey),
          ...liveTestActorHeaders(body.reviewedBy, options?.testActorId),
        },
        tenantScope,
      ),
    },
  );

  await throwIfNotOk(res, "POST /v1/governance/approval-requests/.../approve");

  return res.json() as Promise<GovernanceApprovalRequestJson>;
}

/** POST `/v1/governance/approval-requests/{id}/reject`. */
export async function rejectGovernanceRequest(
  request: APIRequestContext,
  approvalRequestId: string,
  body: { reviewedBy: string; reviewComment?: string },
  options?: LiveGovernanceReviewRequestOptions,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<GovernanceApprovalRequestJson> {
  const res = await request.post(
    `${resolveLiveApiBase()}/v1/governance/approval-requests/${approvalRequestId}/reject`,
    {
      data: {
        reviewedBy: body.reviewedBy,
        reviewComment: body.reviewComment ?? null,
      },
      headers: mergeTenantScope(
        {
          ...liveJsonHeaders(options?.apiKey),
          ...liveTestActorHeaders(body.reviewedBy, options?.testActorId),
        },
        tenantScope,
      ),
    },
  );

  await throwIfNotOk(res, "POST /v1/governance/approval-requests/.../reject");

  return res.json() as Promise<GovernanceApprovalRequestJson>;
}

/** POST reject without throwing — for negative-path assertions. */
export async function postGovernanceRejectRaw(
  request: APIRequestContext,
  approvalRequestId: string,
  body: { reviewedBy: string; reviewComment?: string | null },
  options?: LiveGovernanceReviewRequestOptions,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/governance/approval-requests/${approvalRequestId}/reject`, {
    data: {
      reviewedBy: body.reviewedBy,
      reviewComment: body.reviewComment ?? null,
    },
    headers: mergeTenantScope(
      {
        ...liveJsonHeaders(options?.apiKey),
        ...liveTestActorHeaders(body.reviewedBy, options?.testActorId),
      },
      tenantScope,
    ),
  });
}

/** GET `/v1/audit/search` — filtered audit events (optional `runId`, `correlationId`, `eventType`). */
export async function searchAudit(
  request: APIRequestContext,
  params: {
    runId?: string;
    correlationId?: string;
    eventType?: string;
    take?: string;
    tenantId?: string;
    workspaceId?: string;
    projectId?: string;
  },
): Promise<AuditEventJson[]> {
  if (!params.runId && !params.correlationId && !params.eventType) {
    throw new Error("searchAudit: provide runId, correlationId, and/or eventType");
  }

  const query: Record<string, string> = { take: params.take ?? "100" };

  if (params.runId) {
    query.runId = params.runId;
  }

  if (params.correlationId) {
    query.correlationId = params.correlationId;
  }

  if (params.eventType) {
    query.eventType = params.eventType;
  }

  const scopeCandidate: LiveTenantScopeHeaders | null =
    params.tenantId !== undefined &&
    params.tenantId.trim().length > 0 &&
    params.workspaceId !== undefined &&
    params.workspaceId.trim().length > 0 &&
    params.projectId !== undefined &&
    params.projectId.trim().length > 0
      ? { tenantId: params.tenantId, workspaceId: params.workspaceId, projectId: params.projectId }
      : null;

  const maxAuditSearchAttempts = 8;

  for (let attempt = 0; attempt < maxAuditSearchAttempts; attempt++) {
    const res = await request.get(`${resolveLiveApiBase()}/v1/audit/search`, {
      params: query,
      headers: mergeTenantScope(liveAcceptHeaders(), scopeCandidate),
    });

    if (res.status() === 429 && attempt < maxAuditSearchAttempts - 1) {
      await delayAfterRateLimitedResponse(res);

      continue;
    }

    await throwIfNotOk(res, "GET /v1/audit/search");

    const body = (await res.json()) as { items: AuditEventJson[] };
    return body.items;
  }

  throw new Error("searchAudit: retry loop exhausted");
}

/** GET `/v1/audit` — recent audit events for scope (newest first). */
export async function listRecentAudit(
  request: APIRequestContext,
  take = 200,
): Promise<AuditEventJson[]> {
  const res = await request.get(`${resolveLiveApiBase()}/v1/audit`, {
    params: { take: String(Math.min(500, Math.max(1, take))) },
    headers: liveAcceptHeaders(),
  });

  await throwIfNotOk(res, "GET /v1/audit");

  const body = (await res.json()) as { items: AuditEventJson[] };

  return body.items;
}

export type AuditEventJson = {
  eventType?: string;
  correlationId?: string | null;
};

/** GET `/v1/artifacts/runs/{runId}/export` — ZIP of committed run (binary). */
export async function getRunExportZip(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.get(`${resolveLiveApiBase()}/v1/artifacts/runs/${runId}/export`, {
    headers: mergeTenantScope(
      liveBinaryAcceptHeaders("application/zip, application/octet-stream, */*"),
      tenantScope,
    ),
  });
}

/** GET `/v1/architecture/run/{runId}/exports` — export audit rows incl. persisted analysis JSON (demo whitelabel pre-fill). */
export async function getRunArchitectureExportHistoryRaw(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.get(`${resolveLiveApiBase()}/v1/architecture/run/${encodeURIComponent(runId)}/exports`, {
    headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
  });
}

/**
 * POST `/v1/architecture/run/{runId}/analysis-report/export/docx/consulting` — consulting-template DOCX
 * (`CanExportConsultingDocx` policy + ExecuteAuthority); returns raw HTTP for Playwright assertions.
 */
export async function postConsultingAnalysisDocxRaw(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  const base = liveJsonHeaders();

  const headers = mergeTenantScope(
    {
      ...base,
      Accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json",
    },
    tenantScope,
  );

  return request.post(
    `${resolveLiveApiBase()}/v1/architecture/run/${encodeURIComponent(runId)}/analysis-report/export/docx/consulting`,
    { data: {}, headers },
  );
}

/** Minimal policy pack content JSON (matches `PolicyPackContentDocument` shape used in API tests). */
export function minimalPolicyPackContentJson(complianceKey: string): string {
  return JSON.stringify({
    complianceRuleIds: [],
    complianceRuleKeys: [complianceKey],
    alertRuleIds: [],
    compositeAlertRuleIds: [],
    advisoryDefaults: {},
    metadata: { liveE2e: "true" },
  });
}

/** POST `/v1/policy-packs` — create pack + initial draft version `1.0.0`. */
export async function createPolicyPack(
  request: APIRequestContext,
  body: {
    name: string;
    description?: string;
    packType: string;
    initialContentJson: string;
  },
): Promise<{ policyPackId: string }> {
  const res = await request.post(`${resolveLiveApiBase()}/v1/policy-packs`, {
    data: {
      name: body.name,
      description: body.description ?? "",
      packType: body.packType,
      initialContentJson: body.initialContentJson,
    },
    headers: liveJsonHeaders(),
  });

  await throwIfNotOk(res, "POST /v1/policy-packs");

  const created = (await res.json()) as { policyPackId?: string };
  const policyPackId = created.policyPackId;

  if (!policyPackId) {
    throw new Error("Create policy pack response missing policyPackId");
  }

  return { policyPackId };
}

/** POST `/v1/policy-packs/{id}/publish` — publish or upsert version. */
export async function publishPolicyPackVersion(
  request: APIRequestContext,
  policyPackId: string,
  body: { version: string; contentJson: string },
): Promise<unknown> {
  const res = await request.post(`${resolveLiveApiBase()}/v1/policy-packs/${policyPackId}/publish`, {
    data: { version: body.version, contentJson: body.contentJson },
    headers: liveJsonHeaders(),
  });

  await throwIfNotOk(res, "POST /v1/policy-packs/.../publish");

  return res.json();
}

/** POST `/v1/policy-packs/{id}/assign` — assign published version to scope tier. */
export async function assignPolicyPack(
  request: APIRequestContext,
  policyPackId: string,
  body: { version: string; scopeLevel?: string; isPinned?: boolean },
): Promise<unknown> {
  const res = await request.post(`${resolveLiveApiBase()}/v1/policy-packs/${policyPackId}/assign`, {
    data: {
      version: body.version,
      scopeLevel: body.scopeLevel ?? "Project",
      isPinned: body.isPinned ?? false,
    },
    headers: liveJsonHeaders(),
  });

  await throwIfNotOk(res, "POST /v1/policy-packs/.../assign");

  return res.json();
}

/** GET `/v1/policy-packs/effective` — resolved packs for current scope. */
export async function getEffectivePolicyPacks(request: APIRequestContext): Promise<{
  packs?: { policyPackId?: string; version?: string }[];
}> {
  const res = await request.get(`${resolveLiveApiBase()}/v1/policy-packs/effective`, {
    headers: liveAcceptHeaders(),
  });

  await throwIfNotOk(res, "GET /v1/policy-packs/effective");

  return res.json() as Promise<{ packs?: { policyPackId?: string; version?: string }[] }>;
}

/** GET `/v1/authority/compare/runs` — compare two authority runs by id (Guid string, with or without dashes). */
export async function compareAuthorityRuns(
  request: APIRequestContext,
  leftRunId: string,
  rightRunId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.get(`${resolveLiveApiBase()}/v1/authority/compare/runs`, {
    params: { leftRunId, rightRunId },
    headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
  });
}

/** POST `/v1/advisory/scans` — schedule advisory scan for a run (2xx/409/404 for capability gaps). */
export async function postAdvisoryScanRaw(
  request: APIRequestContext,
  body: { runId: string; description?: string },
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/advisory/scans`, {
    data: { runId: body.runId, description: body.description ?? "" },
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });
}

/** POST `/v1/architecture/run/{runId}/replay` — architecture replay (`ReplayRunRequest` accepts `{}`). */
export async function postReplayRunRaw(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  const encoded = encodeURIComponent(runId);
  const label = `POST /v1/architecture/run/${encoded}/replay`;
  const retryStartedMs = Date.now();
  let infrastructureAttempt = 0;

  for (let attempt = 0; attempt < maxCommitTransient409Attempts; attempt++) {
    if (Date.now() - retryStartedMs >= commitRetryWallClockBudgetMs) {
      throw new InfraTransientError(
        `postReplayRunRaw: wall-clock retry budget exhausted after ${commitRetryWallClockBudgetMs}ms for run ${runId}`,
      );
    }

    const res = await request.post(`${resolveLiveApiBase()}/v1/architecture/run/${encoded}/replay`, {
      data: {},
      headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
      timeout: commitAttemptHttpTimeoutMs,
    });
    const status = res.status();

    if (status === 429 && attempt < maxCommitTransient409Attempts - 1) {
      await delayAfterRateLimitedResponse(res);

      continue;
    }

    if (res.ok()) {
      return res;
    }

    const responseBody = await res.text();

    if (
      await continueInfrastructureMutationRetry(
        status,
        responseBody,
        infrastructureAttempt,
        maxCommitInfrastructureAttempts(),
        label,
        { startedAtMs: retryStartedMs },
      )
    ) {
      infrastructureAttempt += 1;

      continue;
    }

    return replayBufferedApiResponse(status, responseBody, res);
  }

  throw new InfraTransientError("postReplayRunRaw: retry loop exhausted");
}

/** POST `/v1/reports/analysis` — analysis report for a run. */
export async function postAnalysisReportRaw(
  request: APIRequestContext,
  body: { runId: string },
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/reports/analysis`, {
    data: { runId: body.runId },
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });
}

/** GET DOCX consulting export for a run (raw for optional 404). */
export async function getDocxArchitecturePackageExportRaw(
  request: APIRequestContext,
  runId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.get(`${resolveLiveApiBase()}/v1/exports/docx/runs/${runId}/architecture-package`, {
    headers: mergeTenantScope(
      liveBinaryAcceptHeaders("application/vnd.openxmlformats-officedocument.wordprocessingml.document, */*"),
      tenantScope,
    ),
  });
}

/** POST `/v1/alert-rules` — create alert rule (raw for status assertions). */
export async function postAlertRuleRaw(
  request: APIRequestContext,
  body: {
    name: string;
    ruleType: string;
    severity: string;
    thresholdValue: number;
    isEnabled: boolean;
    targetChannelType: string;
    metadataJson: string;
  },
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/alert-rules`, {
    data: body,
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });
}

/** GET `/v1/alert-rules` — list rules. */
export async function getAlertRulesRaw(
  request: APIRequestContext,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<APIResponse> {
  return request.get(`${resolveLiveApiBase()}/v1/alert-rules`, {
    headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
  });
}

/** GET `/v1/graph/runs/{runGuid}` — knowledge graph for run. */
export async function getGraphForRunRaw(request: APIRequestContext, runGuidPathSegment: string): Promise<APIResponse> {
  return request.get(`${resolveLiveApiBase()}/v1/graph/runs/${runGuidPathSegment}`, {
    headers: liveAcceptHeaders(),
  });
}

/** POST `/v1/ask` — RAG-style question (raw; may be 503 when LLM unavailable). */
export async function postAskRaw(
  request: APIRequestContext,
  body: { runId: string; question: string },
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/ask`, {
    data: { runId: body.runId, question: body.question },
    headers: liveJsonHeaders(),
  });
}

export type DigestSubscriptionJson = {
  subscriptionId?: string;
  name?: string;
  channelType?: string;
  destination?: string;
  isEnabled?: boolean;
};

/** POST `/v1/digest-subscriptions` — create digest route (ExecuteAuthority). */
export async function createDigestSubscription(
  request: APIRequestContext,
  body: { name: string; channelType: string; destination: string; isEnabled?: boolean; metadataJson?: string },
): Promise<DigestSubscriptionJson> {
  const res = await request.post(`${resolveLiveApiBase()}/v1/digest-subscriptions`, {
    data: {
      name: body.name,
      channelType: body.channelType,
      destination: body.destination,
      isEnabled: body.isEnabled ?? true,
      metadataJson: body.metadataJson ?? "{}",
    },
    headers: liveJsonHeaders(),
  });

  await throwIfNotOk(res, "POST /v1/digest-subscriptions");

  return res.json() as Promise<DigestSubscriptionJson>;
}

/** GET `/v1/digest-subscriptions` — list subscriptions in scope. */
export async function listDigestSubscriptions(request: APIRequestContext): Promise<DigestSubscriptionJson[]> {
  const res = await request.get(`${resolveLiveApiBase()}/v1/digest-subscriptions`, {
    headers: liveAcceptHeaders(),
  });

  await throwIfNotOk(res, "GET /v1/digest-subscriptions");

  return res.json() as Promise<DigestSubscriptionJson[]>;
}

/** POST `/v1/digest-subscriptions/{id}/toggle` — flip enabled flag. */
export async function toggleDigestSubscription(
  request: APIRequestContext,
  subscriptionId: string,
): Promise<DigestSubscriptionJson> {
  const res = await request.post(`${resolveLiveApiBase()}/v1/digest-subscriptions/${subscriptionId}/toggle`, {
    headers: liveAcceptHeaders(),
  });

  await throwIfNotOk(res, "POST /v1/digest-subscriptions/.../toggle");

  return res.json() as Promise<DigestSubscriptionJson>;
}

/** Headers for non-production `POST /v1/e2e/*` harness routes (must match `ArchLucid:E2eHarness:SharedSecret` on the API). */
export function liveE2eHarnessHeaders(): Record<string, string> {
  const s = process.env.LIVE_E2E_HARNESS_SECRET?.trim() ?? "";

  if (s.length < 16) {
    throw new Error("LIVE_E2E_HARNESS_SECRET must be set to >= 16 chars for harness calls.");
  }

  return {
    "X-ArchLucid-E2e-Harness-Secret": s,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/** POST `/v1/e2e/trial/set-expires` — clock harness (SQL updates `TrialExpiresUtc`). */
export async function postHarnessTrialSetExpires(
  request: APIRequestContext,
  tenantId: string,
  expiresUtcIso: string,
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/e2e/trial/set-expires`, {
    headers: liveE2eHarnessHeaders(),
    data: { tenantId, expiresUtc: expiresUtcIso },
  });
}

/** POST `/v1/e2e/billing/simulate-subscription-activated` — invokes billing activator (Stripe-style outcome). */
export async function postHarnessBillingSimulateActivated(
  request: APIRequestContext,
  body: Record<string, unknown>,
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/e2e/billing/simulate-subscription-activated`, {
    headers: liveE2eHarnessHeaders(),
    data: body,
  });
}

/** GET `/v1/tenant/trial-status` for the given tenant scope. */
export async function getTenantTrialStatus(
  request: APIRequestContext,
  scope: LiveTenantScopeHeaders,
): Promise<{
  status?: string;
  daysRemaining?: number | null;
  trialRunsUsed?: number;
  trialRunsLimit?: number | null;
  trialSeatsUsed?: number;
  trialSeatsLimit?: number | null;
  trialSampleRunId?: string | null;
  trialWelcomeRunId?: string | null;
  trialExpiresUtc?: string | null;
  firstCommitUtc?: string | null;
  baselineReviewCycleHours?: number | null;
  baselineReviewCycleSource?: string | null;
  baselineReviewCycleCapturedUtc?: string | null;
}> {
  const res = await request.get(`${resolveLiveApiBase()}/v1/tenant/trial-status`, {
    headers: mergeTenantScope(liveAcceptHeaders(), scope),
  });

  await throwIfNotOk(res, "GET /v1/tenant/trial-status");

  return res.json() as Promise<{
    status?: string;
    daysRemaining?: number | null;
    trialRunsUsed?: number;
    trialRunsLimit?: number | null;
    trialSeatsUsed?: number;
    trialSeatsLimit?: number | null;
    trialSampleRunId?: string | null;
    trialWelcomeRunId?: string | null;
    trialExpiresUtc?: string | null;
    firstCommitUtc?: string | null;
    baselineReviewCycleHours?: number | null;
    baselineReviewCycleSource?: string | null;
    baselineReviewCycleCapturedUtc?: string | null;
  }>;
}

const DRAFT_BASE = "/v1/architecture/draft";

export type LiveDraftAdmissionResponse = {
  admitted?: boolean;
  draftId?: string;
  status?: string;
};

export type LiveDraftQuestionsResponse = {
  selection?: {
    pendingMustQuestions?: Array<{ questionKey: string; prompt: string }>;
  };
};

export type LiveSubmitDraftResponse = {
  runId?: string;
  status?: string;
};

/** POST `/v1/architecture/draft` — create a mutable intake draft. */
export async function createDraftRequestLive(
  request: APIRequestContext,
  freeTextIntent: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<{ draftId: string }> {
  const res = await request.post(`${resolveLiveApiBase()}${DRAFT_BASE}`, {
    data: { freeTextIntent },
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "POST /v1/architecture/draft");

  const body = (await res.json()) as { draftId?: string };

  if (!body.draftId) {
    throw new Error("Create draft response missing draftId");
  }

  return { draftId: body.draftId };
}

/** PATCH `/v1/architecture/draft/{draftId}` — patch intake fields before admission. */
export async function patchDraftRequestLive(
  request: APIRequestContext,
  draftId: string,
  body: Record<string, unknown>,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<void> {
  const res = await request.patch(`${resolveLiveApiBase()}${DRAFT_BASE}/${encodeURIComponent(draftId)}`, {
    data: body,
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "PATCH /v1/architecture/draft/{draftId}");
}

/** POST `/v1/architecture/draft/{draftId}/admit` */
export async function admitDraftRequestLive(
  request: APIRequestContext,
  draftId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<LiveDraftAdmissionResponse> {
  const res = await request.post(`${resolveLiveApiBase()}${DRAFT_BASE}/${encodeURIComponent(draftId)}/admit`, {
    data: {},
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "POST /v1/architecture/draft/{draftId}/admit");

  return res.json() as Promise<LiveDraftAdmissionResponse>;
}

/** GET `/v1/architecture/draft/{draftId}/questions` */
export async function getDraftQuestionsLive(
  request: APIRequestContext,
  draftId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<LiveDraftQuestionsResponse> {
  const res = await request.get(`${resolveLiveApiBase()}${DRAFT_BASE}/${encodeURIComponent(draftId)}/questions`, {
    headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "GET /v1/architecture/draft/{draftId}/questions");

  return res.json() as Promise<LiveDraftQuestionsResponse>;
}

/** POST `/v1/architecture/draft/{draftId}/skip` */
export async function skipDraftQuestionLive(
  request: APIRequestContext,
  draftId: string,
  questionKey: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<void> {
  const res = await request.post(`${resolveLiveApiBase()}${DRAFT_BASE}/${encodeURIComponent(draftId)}/skip`, {
    data: { questionKey },
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "POST /v1/architecture/draft/{draftId}/skip");
}

/** POST `/v1/architecture/draft/{draftId}/submit` — spawn architecture run. */
export async function submitDraftRequestLive(
  request: APIRequestContext,
  draftId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<LiveSubmitDraftResponse> {
  const res = await request.post(`${resolveLiveApiBase()}${DRAFT_BASE}/${encodeURIComponent(draftId)}/submit`, {
    data: {},
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "POST /v1/architecture/draft/{draftId}/submit");

  return res.json() as Promise<LiveSubmitDraftResponse>;
}

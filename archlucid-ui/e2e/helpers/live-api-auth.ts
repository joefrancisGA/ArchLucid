/**
 * Live-API auth lane and actor identity resolution.
 *
 * Auth lanes (see `docs/LIVE_E2E_AUTH_ASSUMPTIONS.md`):
 * - **JWT:** `LIVE_JWT_TOKEN` → `Authorization: Bearer …` (takes precedence over API key when both are set).
 * - **ApiKey:** `LIVE_API_KEY` → `X-Api-Key`.
 * - **DevelopmentBypass:** no auth headers.
 */
import { isLiveJwtTokenConfigured } from "./jwt-token-provider";

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

/** Trimmed `LIVE_API_KEY`, or an empty string. Shared with the header builders. */
export function readLiveAdminApiKeyFromEnv(): string {
  return process.env.LIVE_API_KEY?.trim() ?? "";
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
  const authMode = resolveLiveAuthMode();

  // ApiKey CI enables AllowTestActorHeaders so governance SoD specs can use one admin key + peer actor headers.
  if (authMode !== "bypass" && authMode !== "apikey") {
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

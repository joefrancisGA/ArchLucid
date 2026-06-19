import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { TrialUpgradeNudgeStatusPayload } from "@/lib/trial-upgrade-nudge-trigger";
import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

/** Browser-side `GET /v1/tenant/trial-status` payload shared across operator shell banners. */
export type TenantTrialStatusClientPayload = TenantTrialStatusPayload & TrialUpgradeNudgeStatusPayload;

const CACHE_TTL_MS = 60_000;

let cachedStatus: TenantTrialStatusClientPayload | null = null;
let cachedAtMs = 0;
let inflight: Promise<TenantTrialStatusClientPayload | null> | null = null;

export function shouldSkipTenantTrialStatusFetch(): boolean {
  return AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn();
}

/** Clears the in-memory dedupe cache (for example after billing checkout or in Vitest). */
export function invalidateTenantTrialStatusCache(): void {
  cachedStatus = null;
  cachedAtMs = 0;
  inflight = null;
}

/** Client-side cache so operator shell trial banners share one read per minute. */
export async function fetchTenantTrialStatusCached(
  options?: { force?: boolean },
): Promise<TenantTrialStatusClientPayload | null> {
  if (shouldSkipTenantTrialStatusFetch()) {
    return null;
  }

  const force = options?.force === true;
  const now = Date.now();

  if (!force && cachedStatus !== null && now - cachedAtMs < CACHE_TTL_MS) {
    return cachedStatus;
  }

  if (!force && inflight !== null) {
    return inflight;
  }

  inflight = (async () => {
    try {
      const res = await fetch(
        "/api/proxy/v1/tenant/trial-status",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
      );

      if (!res.ok) {
        cachedStatus = null;
        cachedAtMs = Date.now();

        return null;
      }

      const json = (await res.json()) as TenantTrialStatusClientPayload;
      cachedStatus = json;
      cachedAtMs = Date.now();

      return json;
    } catch {
      cachedStatus = null;
      cachedAtMs = Date.now();

      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

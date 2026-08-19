import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";
import type { TrialUpgradeNudgeStatusPayload } from "@/lib/trial-upgrade-nudge-trigger";
import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

/** Browser-side `GET /v1/tenant/trial-status` payload shared across operator shell banners. */
export type TenantTrialStatusClientPayload = TenantTrialStatusPayload & TrialUpgradeNudgeStatusPayload;

export function shouldSkipTenantTrialStatusFetch(): boolean {
  return AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn();
}

/** Raw fetch for TanStack Query `queryFn` and imperative callers. */
export async function fetchTenantTrialStatus(): Promise<TenantTrialStatusClientPayload | null> {
  if (shouldSkipTenantTrialStatusFetch()) {
    return null;
  }

  try {
    const res = await fetch(
      "/api/proxy/v1/tenant/trial-status",
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
    );

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as TenantTrialStatusClientPayload;
  } catch {
    return null;
  }
}

/** Imperative read through the shared TanStack Query cache. */
export async function fetchTenantTrialStatusCached(
  options?: { force?: boolean },
): Promise<TenantTrialStatusClientPayload | null> {
  if (shouldSkipTenantTrialStatusFetch()) {
    return null;
  }

  const queryClient = getOperatorQueryClient();

  if (options?.force === true) {
    await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.tenantTrialStatus });
  }

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.tenantTrialStatus,
    queryFn: fetchTenantTrialStatus,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}

/** Clears cached trial status (for example after billing checkout or in Vitest). */
export async function invalidateTenantTrialStatusCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.tenantTrialStatus });
}

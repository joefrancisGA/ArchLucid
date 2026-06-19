import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";
import type { TeamExpansionNudgeStatusPayload } from "@/lib/team-expansion-nudge-trigger";

export function shouldSkipTenantUsageStatusFetch(): boolean {
  return AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn();
}

/** Raw fetch for TanStack Query `queryFn` and imperative callers. */
export async function fetchTenantUsageStatus(): Promise<TeamExpansionNudgeStatusPayload | null> {
  if (shouldSkipTenantUsageStatusFetch()) {
    return null;
  }

  try {
    const res = await fetch(
      "/api/proxy/v1/tenant/usage-status",
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
    );

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as TeamExpansionNudgeStatusPayload;
  } catch {
    return null;
  }
}

/** Imperative read through the shared TanStack Query cache. */
export async function fetchTenantUsageStatusCached(
  options?: { force?: boolean },
): Promise<TeamExpansionNudgeStatusPayload | null> {
  if (shouldSkipTenantUsageStatusFetch()) {
    return null;
  }

  const queryClient = getOperatorQueryClient();

  if (options?.force === true) {
    await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.tenantUsageStatus });
  }

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.tenantUsageStatus,
    queryFn: fetchTenantUsageStatus,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}

/** Clears cached usage status (for example in Vitest). */
export async function invalidateTenantUsageStatusCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.tenantUsageStatus });
}

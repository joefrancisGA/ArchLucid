import type { HealthReadyResponse } from "@/lib/health-dashboard-types";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

/** Imperative read through the shared TanStack Query cache. */
export async function fetchHealthReadySummaryCached(
  options?: { force?: boolean },
): Promise<HealthReadyResponse | null> {
  const queryClient = getOperatorQueryClient();

  if (options?.force === true) {
    await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.healthReadySummary });
  }

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.healthReadySummary,
    queryFn: fetchHealthReadySummary,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}

/** Clears cached health readiness (for example in Vitest). */
export async function invalidateHealthReadySummaryCache(): Promise<void> {
  const queryClient = getOperatorQueryClient();

  await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.healthReadySummary });
}

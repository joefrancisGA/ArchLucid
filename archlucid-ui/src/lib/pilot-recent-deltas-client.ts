import type { RecentPilotRunDeltasPayload } from "@/components/BeforeAfterDelta/types";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

const RECENT_DELTAS_PROXY_PATH = "/api/proxy/v1/pilots/runs/recent-deltas";

/** Raw fetch for TanStack Query `queryFn` (TB-562). */
export async function fetchPilotRecentDeltas(count: number): Promise<RecentPilotRunDeltasPayload | null> {
  try {
    const url = `${RECENT_DELTAS_PROXY_PATH}?count=${encodeURIComponent(String(count))}`;
    const res = await fetch(
      url,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
    );

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as RecentPilotRunDeltasPayload;
  } catch {
    return null;
  }
}

/** Imperative read through the shared TanStack Query cache. */
export async function fetchPilotRecentDeltasCached(
  count: number,
  options?: { force?: boolean },
): Promise<RecentPilotRunDeltasPayload | null> {
  const queryClient = getOperatorQueryClient();
  const queryKey = operatorQueryKeys.pilotRecentDeltas(count);

  if (options?.force === true) {
    await queryClient.invalidateQueries({ queryKey });
  }

  return queryClient.fetchQuery({
    queryKey,
    queryFn: () => fetchPilotRecentDeltas(count),
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}

/** Clears cached recent-delta payloads (for example after a review finalizes). */
export async function invalidatePilotRecentDeltasCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: ["operator", "pilots", "recent-deltas"] });
}

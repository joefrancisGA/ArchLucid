import { listRunsByProjectPaged } from "@/lib/api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import type { RunsByProjectPagedParams } from "@/lib/query/runs-by-project-paged-params";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

import type { PagedResponse } from "@/types/pagination";
import type { RunSummary } from "@/types/authority";

/** Raw fetch for TanStack Query `queryFn` (TB-562). */
export async function fetchRunsByProjectPaged(params: RunsByProjectPagedParams): Promise<PagedResponse<RunSummary>> {
  return listRunsByProjectPaged(params.projectId, params.page, params.pageSize);
}

/** Imperative read through the shared TanStack Query cache. */
export async function fetchRunsByProjectPagedCached(
  params: RunsByProjectPagedParams,
  options?: { force?: boolean },
): Promise<PagedResponse<RunSummary>> {
  const queryClient = getOperatorQueryClient();
  const queryKey = operatorQueryKeys.runsByProjectPaged(params);

  if (options?.force === true) {
    await queryClient.invalidateQueries({ queryKey });
  }

  return queryClient.fetchQuery({
    queryKey,
    queryFn: () => fetchRunsByProjectPaged(params),
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}

/** Clears cached runs list pages (for example after restore or new review). */
export async function invalidateRunsByProjectPagedCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: ["operator", "runs", "paged"] });
}

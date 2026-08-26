"use client";

import { fetchRunDetailWorkspaceContextBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseRunDetailWorkspaceContextBundleQueryOptions = {
  readonly enabled?: boolean;
};

export function useRunDetailWorkspaceContextBundleQuery(
  runId: string,
  options?: UseRunDetailWorkspaceContextBundleQueryOptions,
) {
  const trimmed = runId.trim();

  return useOperatorQueryHook({
    queryKey: operatorQueryKeys.runDetailWorkspaceContextBundle(trimmed),
    queryFn: () => fetchRunDetailWorkspaceContextBundle(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}

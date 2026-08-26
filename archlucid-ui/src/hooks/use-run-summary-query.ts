"use client";

import { getRunSummary } from "@/lib/api";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { RunSummary } from "@/types/authority";

type UseRunSummaryQueryOptions = {
  readonly enabled?: boolean;
};

export function useRunSummaryQuery(runId: string, options?: UseRunSummaryQueryOptions) {
  const trimmed = runId.trim();

  return useOperatorQueryHook<RunSummary>({
    queryKey: operatorQueryKeys.runSummary(trimmed),
    queryFn: () => getRunSummary(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}

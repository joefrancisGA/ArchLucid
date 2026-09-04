"use client";

import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseAskRunCoverageHonestyQueryOptions = {
  readonly enabled?: boolean;
};

/** Loads run summary + manifest inputs for Ask coverage honesty (WA-07). */
export function useAskRunCoverageHonestyQuery(
  runId: string,
  options?: UseAskRunCoverageHonestyQueryOptions,
) {
  const trimmed = runId.trim();

  return createOperatorQueryHook({
    queryKey: [...operatorQueryKeys.runSummary(trimmed), "ask-coverage-honesty"],
    queryFn: async () => {
      const response = await fetchRunDetailCriticalPageBundle(trimmed);

      return response.data;
    },
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}

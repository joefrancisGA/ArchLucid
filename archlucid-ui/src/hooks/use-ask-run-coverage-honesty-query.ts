"use client";

import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { askRunCoverageHonestyBlockedReason } from "@/lib/ask/ask-run-coverage-honesty-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
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

  const query = createOperatorQueryHook({
    queryKey: [...operatorQueryKeys.runSummary(trimmed), "ask-coverage-honesty"],
    queryFn: async () => {
      const response = await fetchRunDetailCriticalPageBundle(trimmed);

      return response.data;
    },
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = askRunCoverageHonestyBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

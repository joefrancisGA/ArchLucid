"use client";

import { getRunSummary } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { runSummaryBlockedReason } from "@/lib/runs/run-summary-blocked-reason";
import type { RunSummary } from "@/types/authority";

type UseRunSummaryQueryOptions = {
  readonly enabled?: boolean;
  readonly authoritative?: boolean;
};

export function useRunSummaryQuery(runId: string, options?: UseRunSummaryQueryOptions) {
  const trimmed = runId.trim();
  const authoritative = options?.authoritative === true;

  const query = createOperatorQueryHook<RunSummary>({
    queryKey: operatorQueryKeys.runSummary(trimmed),
    queryFn: () => getRunSummary(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
    ...(authoritative
      ? {
          staleTime: 30_000,
          refetchOnWindowFocus: true,
          refetchInterval: 120_000,
          refetchIntervalInBackground: false,
        }
      : {}),
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = runSummaryBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

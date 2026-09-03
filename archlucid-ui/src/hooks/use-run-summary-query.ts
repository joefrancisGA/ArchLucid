"use client";

import { getRunSummary } from "@/lib/api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { RunSummary } from "@/types/authority";

type UseRunSummaryQueryOptions = {
  readonly enabled?: boolean;
  readonly authoritative?: boolean;
};

export function useRunSummaryQuery(runId: string, options?: UseRunSummaryQueryOptions) {
  const trimmed = runId.trim();
  const authoritative = options?.authoritative === true;

  return createOperatorQueryHook<RunSummary>({
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
}

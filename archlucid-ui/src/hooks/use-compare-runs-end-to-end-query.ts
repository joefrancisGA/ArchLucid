"use client";

import { compareRunsEndToEnd } from "@/lib/api/architecture-runs";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseCompareRunsEndToEndQueryOptions = {
  readonly enabled?: boolean;
};

export function useCompareRunsEndToEndQuery(
  baselineRunId: string,
  targetRunId: string,
  options?: UseCompareRunsEndToEndQueryOptions,
) {
  const baseline = baselineRunId.trim();
  const target = targetRunId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.compareRunsEndToEnd(baseline, target),
    queryFn: () => compareRunsEndToEnd(baseline, target),
    enabled: (options?.enabled ?? true) && baseline.length > 0 && target.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = compareRunPairBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

"use client";

import { compareRunsEndToEnd } from "@/lib/api/architecture-runs";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
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

  return useOperatorQueryHook({
    queryKey: operatorQueryKeys.compareRunsEndToEnd(baseline, target),
    queryFn: () => compareRunsEndToEnd(baseline, target),
    enabled: (options?.enabled ?? true) && baseline.length > 0 && target.length > 0,
  });
}

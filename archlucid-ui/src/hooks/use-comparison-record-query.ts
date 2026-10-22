"use client";

import { getComparisonRecord, getComparisonSummary } from "@/lib/api/comparison-record-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { comparisonRecordBlockedReason } from "@/lib/compare/comparison-record-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseComparisonRecordQueryOptions = {
  readonly enabled?: boolean;
};

export function useComparisonRecordQuery(
  comparisonRecordId: string,
  options?: UseComparisonRecordQueryOptions,
) {
  const trimmed = comparisonRecordId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.comparisonRecord(trimmed),
    queryFn: () => getComparisonRecord(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = comparisonRecordBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

export function useComparisonSummaryQuery(
  comparisonRecordId: string,
  options?: UseComparisonRecordQueryOptions,
) {
  const trimmed = comparisonRecordId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.comparisonSummary(trimmed),
    queryFn: () => getComparisonSummary(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = comparisonRecordBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

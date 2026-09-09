"use client";

import { getExportRecordComparisonHistory } from "@/lib/api/export-record-comparison-api";
import { exportRecordComparisonHistoryBlockedReason } from "@/lib/compare/export-record-comparison-history-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseExportRecordComparisonHistoryQueryOptions = {
  readonly enabled?: boolean;
};

export function useExportRecordComparisonHistoryQuery(
  exportRecordId: string,
  options?: UseExportRecordComparisonHistoryQueryOptions,
) {
  const trimmed = exportRecordId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.exportRecordComparisonHistory(trimmed),
    queryFn: () => getExportRecordComparisonHistory(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = exportRecordComparisonHistoryBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

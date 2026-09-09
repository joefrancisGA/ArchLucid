"use client";

import { getRunExportHistory } from "@/lib/api/run-export-history-api";
import { runExportHistoryBlockedReason } from "@/lib/exports/run-export-history-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseRunExportHistoryQueryOptions = {
  readonly enabled?: boolean;
};

export function useRunExportHistoryQuery(runId: string, options?: UseRunExportHistoryQueryOptions) {
  const trimmed = runId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.runExportHistory(trimmed),
    queryFn: () => getRunExportHistory(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = runExportHistoryBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

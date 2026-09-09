"use client";

import { getExportRecord } from "@/lib/api/export-record-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { exportRecordBlockedReason } from "@/lib/exports/export-record-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseExportRecordQueryOptions = {
  readonly enabled?: boolean;
};

export function useExportRecordQuery(exportRecordId: string, options?: UseExportRecordQueryOptions) {
  const trimmed = exportRecordId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.exportRecord(trimmed),
    queryFn: () => getExportRecord(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = exportRecordBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

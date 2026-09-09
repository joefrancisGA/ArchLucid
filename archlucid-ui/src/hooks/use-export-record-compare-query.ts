"use client";

import { compareExportRecords } from "@/lib/api/export-record-compare-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { exportRecordCompareBlockedReason } from "@/lib/exports/export-record-compare-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseExportRecordCompareQueryOptions = {
  readonly leftExportRecordId: string;
  readonly rightExportRecordId: string;
  readonly enabled?: boolean;
};

export function useExportRecordCompareQuery(options: UseExportRecordCompareQueryOptions) {
  const leftExportRecordId = options.leftExportRecordId.trim();
  const rightExportRecordId = options.rightExportRecordId.trim();
  const enabled =
    (options.enabled ?? true) && leftExportRecordId.length > 0 && rightExportRecordId.length > 0;

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.exportRecordCompare(leftExportRecordId, rightExportRecordId),
    queryFn: () => compareExportRecords(leftExportRecordId, rightExportRecordId),
    enabled,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = exportRecordCompareBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

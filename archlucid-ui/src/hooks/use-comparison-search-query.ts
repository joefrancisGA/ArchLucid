"use client";

import { searchComparisonRecords, type ComparisonSearchQuery } from "@/lib/api/comparison-record-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { comparisonSearchBlockedReason } from "@/lib/compare/comparison-search-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseComparisonSearchQueryOptions = {
  readonly query: ComparisonSearchQuery;
  readonly enabled?: boolean;
};

export function useComparisonSearchQuery(options: UseComparisonSearchQueryOptions) {
  const searchKey = {
    comparisonType: options.query.comparisonType ?? "",
    leftRunId: options.query.leftRunId ?? "",
    rightRunId: options.query.rightRunId ?? "",
    leftExportRecordId: options.query.leftExportRecordId ?? "",
    rightExportRecordId: options.query.rightExportRecordId ?? "",
    label: options.query.label ?? "",
    cursor: options.query.cursor ?? "",
    pageSize: options.query.pageSize ?? "",
  };

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.comparisonSearch(searchKey),
    queryFn: () => searchComparisonRecords(options.query),
    enabled: options.enabled ?? true,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = comparisonSearchBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

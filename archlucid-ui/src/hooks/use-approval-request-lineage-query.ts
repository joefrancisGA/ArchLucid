"use client";

import { getApprovalRequestLineage } from "@/lib/api";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseApprovalRequestLineageQueryOptions = {
  readonly enabled?: boolean;
};

export function useApprovalRequestLineageQuery(
  approvalRequestId: string,
  options?: UseApprovalRequestLineageQueryOptions,
) {
  const trimmed = approvalRequestId.trim();

  return useOperatorQueryHook({
    queryKey: operatorQueryKeys.approvalRequestLineage(trimmed),
    queryFn: () => getApprovalRequestLineage(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}

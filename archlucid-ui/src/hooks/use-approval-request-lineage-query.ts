"use client";

import { getApprovalRequestLineage } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { governanceApprovalLineageBlockedReason } from "@/lib/governance/governance-approval-lineage-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseApprovalRequestLineageQueryOptions = {
  readonly enabled?: boolean;
};

export function useApprovalRequestLineageQuery(
  approvalRequestId: string,
  options?: UseApprovalRequestLineageQueryOptions,
) {
  const trimmed = approvalRequestId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.approvalRequestLineage(trimmed),
    queryFn: () => getApprovalRequestLineage(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = governanceApprovalLineageBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

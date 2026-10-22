"use client";

import { getGovernanceApprovalRationale } from "@/lib/api/governance-workflow-api-approvals";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { governanceApprovalLineageBlockedReason } from "@/lib/governance/governance-approval-lineage-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseGovernanceApprovalRationaleQueryOptions = {
  readonly approvalRequestId: string;
  readonly enabled?: boolean;
};

export function useGovernanceApprovalRationaleQuery(options: UseGovernanceApprovalRationaleQueryOptions) {
  const approvalRequestId = options.approvalRequestId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.governanceApprovalRationale(approvalRequestId),
    queryFn: () => getGovernanceApprovalRationale(approvalRequestId),
    enabled: (options.enabled ?? true) && approvalRequestId.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = governanceApprovalLineageBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

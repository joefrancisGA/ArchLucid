"use client";

import { getDraftBranchQuota } from "@/lib/api/draft-intake-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { architectureDraftBranchQuotaBlockedReason } from "@/lib/architecture/architecture-draft-list-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { DraftBranchQuotaResponse } from "@/types/draft-intake";

type UseDraftBranchQuotaQueryOptions = {
  readonly enabled?: boolean;
};

export function useDraftBranchQuotaQuery(
  draftId: string,
  options?: UseDraftBranchQuotaQueryOptions,
) {
  const trimmed = draftId.trim();

  const query = createOperatorQueryHook<DraftBranchQuotaResponse>({
    queryKey: operatorQueryKeys.draftBranchQuota(trimmed),
    queryFn: () => getDraftBranchQuota(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = architectureDraftBranchQuotaBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

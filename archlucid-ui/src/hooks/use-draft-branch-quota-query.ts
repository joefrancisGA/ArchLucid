"use client";

import { getDraftBranchQuota } from "@/lib/api/draft-intake-api";
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

  return createOperatorQueryHook<DraftBranchQuotaResponse>({
    queryKey: operatorQueryKeys.draftBranchQuota(trimmed),
    queryFn: () => getDraftBranchQuota(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}

"use client";

import { listPolicyPackVersions } from "@/lib/api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { PolicyPackVersion } from "@/types/policy-packs";

type UsePolicyPackVersionsQueryOptions = {
  readonly enabled?: boolean;
};

export function usePolicyPackVersionsQuery(
  packId: string,
  options?: UsePolicyPackVersionsQueryOptions,
) {
  const trimmed = packId.trim();

  return createOperatorQueryHook<PolicyPackVersion[]>({
    queryKey: operatorQueryKeys.policyPackVersions(trimmed),
    queryFn: () => listPolicyPackVersions(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}

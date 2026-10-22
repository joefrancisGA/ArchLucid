"use client";

import { getPolicyPackVersion } from "@/lib/api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { PolicyPackVersion } from "@/types/policy-packs";

type UsePolicyPackVersionDetailQueryOptions = {
  readonly enabled?: boolean;
};

export function usePolicyPackVersionDetailQuery(
  packId: string,
  version: string,
  options?: UsePolicyPackVersionDetailQueryOptions,
) {
  const trimmedPackId = packId.trim();
  const trimmedVersion = version.trim();

  return createOperatorQueryHook<PolicyPackVersion>({
    queryKey: operatorQueryKeys.policyPackVersionDetail(trimmedPackId, trimmedVersion),
    queryFn: () => getPolicyPackVersion(trimmedPackId, trimmedVersion),
    enabled:
      (options?.enabled ?? true) && trimmedPackId.length > 0 && trimmedVersion.length > 0,
  });
}

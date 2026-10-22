"use client";

import { getEffectivePolicyContent } from "@/lib/api/policy-governance-api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { PolicyPackContentDocument } from "@/types/policy-packs";

type UseEffectivePolicyContentQueryOptions = {
  readonly enabled?: boolean;
};

export function useEffectivePolicyContentQuery(options?: UseEffectivePolicyContentQueryOptions) {
  return createOperatorQueryHook<PolicyPackContentDocument>({
    queryKey: operatorQueryKeys.effectivePolicyContent,
    queryFn: getEffectivePolicyContent,
    enabled: options?.enabled ?? true,
  });
}

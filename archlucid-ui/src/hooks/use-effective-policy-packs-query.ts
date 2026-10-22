"use client";

import { getEffectivePolicyPacks } from "@/lib/api/policy-governance-api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { EffectivePolicyPackSet } from "@/types/policy-packs";

type UseEffectivePolicyPacksQueryOptions = {
  readonly enabled?: boolean;
};

export function useEffectivePolicyPacksQuery(options?: UseEffectivePolicyPacksQueryOptions) {
  return createOperatorQueryHook<EffectivePolicyPackSet>({
    queryKey: operatorQueryKeys.effectivePolicyPacks,
    queryFn: getEffectivePolicyPacks,
    enabled: options?.enabled ?? true,
  });
}

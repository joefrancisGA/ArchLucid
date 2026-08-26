"use client";

import type { PolicyPackRuleTemplate } from "@/lib/policy/policy-pack-visual-builder";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

async function fetchPolicyPackRuleTemplates(): Promise<PolicyPackRuleTemplate[]> {
  const response = await fetch("/api/proxy/v1/policy-packs/rule-templates", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Could not load templates (${response.status}).`);
  }

  return (await response.json()) as PolicyPackRuleTemplate[];
}

type UsePolicyPackRuleTemplatesQueryOptions = {
  readonly enabled?: boolean;
};

export function usePolicyPackRuleTemplatesQuery(options?: UsePolicyPackRuleTemplatesQueryOptions) {
  return useOperatorQueryHook<PolicyPackRuleTemplate[]>({
    queryKey: operatorQueryKeys.policyPackRuleTemplates,
    queryFn: fetchPolicyPackRuleTemplates,
    enabled: options?.enabled ?? true,
  });
}

import { useQuery } from "@tanstack/react-query";

import { fetchGovernanceEnvironmentCatalog } from "@/lib/api/policy-governance-api";
import type { GovernanceEnvironmentCatalog } from "@/types/governance-environment-catalog";

export const governanceEnvironmentCatalogQueryKey = ["governance-environment-catalog"] as const;

export function useGovernanceEnvironmentCatalogQuery() {
  return useQuery<GovernanceEnvironmentCatalog>({
    queryKey: governanceEnvironmentCatalogQueryKey,
    queryFn: fetchGovernanceEnvironmentCatalog,
    staleTime: 60_000,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchGovernanceEnvironmentCatalog } from "@/lib/api/policy-governance-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { governanceEnvironmentCatalogBlockedReason } from "@/lib/governance/governance-workflow-read-blocked-reason";
import type { GovernanceEnvironmentCatalog } from "@/types/governance-environment-catalog";

export const governanceEnvironmentCatalogQueryKey = ["governance-environment-catalog"] as const;

export function useGovernanceEnvironmentCatalogQuery() {
  const query = useQuery<GovernanceEnvironmentCatalog>({
    queryKey: governanceEnvironmentCatalogQueryKey,
    queryFn: fetchGovernanceEnvironmentCatalog,
    staleTime: 60_000,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = governanceEnvironmentCatalogBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

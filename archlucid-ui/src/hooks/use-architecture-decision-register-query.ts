"use client";

import {
  getArchitectureDecisionRegister,
  type ArchitectureDecisionRegisterFilters,
} from "@/lib/api/governance-stickiness-api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type {
  ArchitectureDecisionRegisterEntry,
} from "@/lib/api/governance-stickiness-api";

export type ArchitectureDecisionRegisterResult = {
  readonly decisions: readonly ArchitectureDecisionRegisterEntry[];
};

function filtersCacheKey(filters?: ArchitectureDecisionRegisterFilters): string {
  if (filters === undefined) {
    return "workspace";
  }

  return JSON.stringify(filters);
}

type UseArchitectureDecisionRegisterQueryOptions = {
  readonly enabled?: boolean;
};

export function useArchitectureDecisionRegisterQuery(
  projectId: string,
  filters?: ArchitectureDecisionRegisterFilters,
  options?: UseArchitectureDecisionRegisterQueryOptions,
) {
  const trimmedProjectId = projectId.trim();
  const filtersKey = filtersCacheKey(filters);

  return createOperatorQueryHook<ArchitectureDecisionRegisterResult>({
    queryKey: operatorQueryKeys.architectureDecisionRegister(trimmedProjectId, filtersKey),
    queryFn: async () => {
      const response = await getArchitectureDecisionRegister(trimmedProjectId, filters);

      return { decisions: response.decisions ?? [] };
    },
    enabled: (options?.enabled ?? true) && trimmedProjectId.length > 0,
  });
}

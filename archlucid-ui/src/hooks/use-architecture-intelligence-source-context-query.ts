"use client";

import {
  fetchArchitectureIntelligenceProductSourceContext,
  type ClosedLoopReasoningSourceText,
} from "@/lib/architecture/architecture-intelligence-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { architectureIntelligenceSourceContextBlockedReason } from "@/lib/architecture/architecture-intelligence-source-context-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";

export type ArchitectureIntelligenceSourceContext = {
  readonly runId: string | null;
  readonly sourceTexts: readonly ClosedLoopReasoningSourceText[];
  readonly declaredPriorities: readonly string[];
};

type UseArchitectureIntelligenceSourceContextQueryOptions = {
  readonly enabled?: boolean;
};

export function useArchitectureIntelligenceSourceContextQuery(
  runId: string,
  options?: UseArchitectureIntelligenceSourceContextQueryOptions,
) {
  const trimmed = runId.trim();
  const scope = useOperatorScopeQueryKey();

  const query = createOperatorQueryHook<ArchitectureIntelligenceSourceContext>({
    queryKey: operatorQueryKeys.architectureIntelligenceSourceContext(scope, trimmed),
    queryFn: async () => {
      const context = await fetchArchitectureIntelligenceProductSourceContext(trimmed);

      return {
        runId: context.runId?.trim() ?? trimmed,
        sourceTexts: context.sourceTexts ?? [],
        declaredPriorities: context.declaredPriorities ?? [],
      };
    },
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = architectureIntelligenceSourceContextBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}

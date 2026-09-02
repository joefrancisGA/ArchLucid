"use client";

import {
  fetchArchitectureIntelligenceProductSourceContext,
  type ClosedLoopReasoningSourceText,
} from "@/lib/architecture/architecture-intelligence-api";
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

  return createOperatorQueryHook<ArchitectureIntelligenceSourceContext>({
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
}

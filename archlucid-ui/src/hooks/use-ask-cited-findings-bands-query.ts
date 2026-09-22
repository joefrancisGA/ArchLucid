"use client";

import { getRunDetail } from "@/lib/api";
import { buildAskCitedFindingBandIndex } from "@/lib/ask/ask-cited-findings-semantic-support-band";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { extractQuickDecisionFindingsFromRunDetail } from "@/lib/quick-decision-finding-from-detail";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseAskCitedFindingsBandsQueryOptions = {
  readonly enabled?: boolean;
};

/** Loads decision-grade finding semantic support bands for Ask cited-finding honesty (AS-069). */
export function useAskCitedFindingsBandsQuery(
  runId: string,
  options?: UseAskCitedFindingsBandsQueryOptions,
) {
  const trimmed = runId.trim();

  const query = createOperatorQueryHook({
    queryKey: [...operatorQueryKeys.runSummary(trimmed), "ask-cited-findings-bands"],
    queryFn: async () => {
      const response = await getRunDetail(trimmed);
      const findings = extractQuickDecisionFindingsFromRunDetail(response.data);

      return buildAskCitedFindingBandIndex(findings);
    },
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;

  return {
    ...query,
    failure,
  };
}

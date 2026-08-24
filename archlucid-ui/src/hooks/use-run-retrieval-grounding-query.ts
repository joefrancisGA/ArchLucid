"use client";

import { getRunRetrievalGrounding } from "@/lib/api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { RunRetrievalGroundingPayload } from "@/types/agent-forensics";

type UseRunRetrievalGroundingQueryOptions = {
  readonly enabled?: boolean;
};

export function useRunRetrievalGroundingQuery(
  runId: string,
  options?: UseRunRetrievalGroundingQueryOptions,
) {
  const trimmed = runId.trim();

  return createOperatorQueryHook<RunRetrievalGroundingPayload | null>({
    queryKey: operatorQueryKeys.runRetrievalGrounding(trimmed),
    queryFn: async () => {
      const response = await getRunRetrievalGrounding(trimmed);

      return response.data;
    },
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}

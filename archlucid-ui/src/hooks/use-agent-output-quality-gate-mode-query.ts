"use client";

import { useQuery } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { fetchAgentOutputQualityGateMode } from "@/lib/agent-output-quality-gate-mode-client";

type UseAgentOutputQualityGateModeQueryOptions = {
  readonly enabled?: boolean;
};

export function useAgentOutputQualityGateModeQuery(options?: UseAgentOutputQualityGateModeQueryOptions) {
  return useQuery({
    queryKey: operatorQueryKeys.agentOutputQualityGateMode,
    queryFn: fetchAgentOutputQualityGateMode,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}

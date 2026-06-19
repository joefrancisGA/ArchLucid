"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchLlmMonthlyDollarBudgetStatus,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

type UseLlmMonthlyBudgetStatusQueryOptions = {
  readonly enabled?: boolean;
  readonly refetchIntervalMs?: number | false;
};

export function useLlmMonthlyBudgetStatusQuery(options?: UseLlmMonthlyBudgetStatusQueryOptions) {
  return useQuery<LlmMonthlyDollarBudgetStatus>({
    queryKey: operatorQueryKeys.llmMonthlyBudgetStatus,
    queryFn: fetchLlmMonthlyDollarBudgetStatus,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchIntervalMs ?? false,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}

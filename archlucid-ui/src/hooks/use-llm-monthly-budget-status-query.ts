"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchLlmMonthlyDollarBudgetStatus,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_GC_MS } from "@/lib/query/operator-query-stale-time";
import {
  resolveShellBannerPollIntervalMs,
  shouldPollLlmMonthlyBudgetStatus,
} from "@/lib/shell-banner-poll-policy";

type UseLlmMonthlyBudgetStatusQueryOptions = {
  readonly enabled?: boolean;
  readonly documentHidden?: boolean;
  /** When true, this observer owns the shared shell poll interval (mount once in the gate). */
  readonly pollOwner?: boolean;
  readonly intervalMs?: number;
  /** Explicit interval override; `false` disables polling. */
  readonly refetchIntervalMs?: number | false;
};

/**
 * LLM budget status is hydrated from `GET /v1/operator/shell-status` before concern observers enable.
 * `staleTime: Infinity` keeps hydrate/`setQueryData` from refetching on every banner/pill mount;
 * `LlmMonthlyBudgetStatusPollOwner` owns `refetchInterval` while budget banners need refresh.
 */
export function useLlmMonthlyBudgetStatusQuery(options?: UseLlmMonthlyBudgetStatusQueryOptions) {
  return useQuery<LlmMonthlyDollarBudgetStatus>({
    queryKey: operatorQueryKeys.llmMonthlyBudgetStatus,
    queryFn: fetchLlmMonthlyDollarBudgetStatus,
    enabled: options?.enabled ?? true,
    staleTime: Infinity,
    gcTime: OPERATOR_QUERY_GC_MS,
    refetchInterval: (query) => {
      if (options?.refetchIntervalMs !== undefined) {
        if (!options.refetchIntervalMs || options.documentHidden === true) {
          return false;
        }

        return options.refetchIntervalMs;
      }

      if (options?.pollOwner !== true) {
        return false;
      }

      return resolveShellBannerPollIntervalMs({
        enabled: options?.enabled ?? true,
        documentHidden: options?.documentHidden ?? false,
        shouldPoll: shouldPollLlmMonthlyBudgetStatus(query.state.data),
        intervalMs: options?.intervalMs,
      });
    },
    refetchIntervalInBackground: false,
  });
}

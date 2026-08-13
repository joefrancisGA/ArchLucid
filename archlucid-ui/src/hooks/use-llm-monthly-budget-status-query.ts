"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchLlmMonthlyDollarBudgetStatus,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { resolveLlmMonthlyBudgetStatusStaleTime } from "@/lib/query/operator-query-stale-time";
import { resolveShellBannerPollIntervalMs } from "@/lib/shell-banner-poll-policy";

type UseLlmMonthlyBudgetStatusQueryOptions = {
  readonly enabled?: boolean;
  readonly documentHidden?: boolean;
  readonly shouldPoll?: (status: LlmMonthlyDollarBudgetStatus | undefined) => boolean;
  readonly intervalMs?: number;
  /** Legacy one-shot interval; prefer `shouldPoll` + `documentHidden`. */
  readonly refetchIntervalMs?: number | false;
};

export function useLlmMonthlyBudgetStatusQuery(options?: UseLlmMonthlyBudgetStatusQueryOptions) {
  return useQuery<LlmMonthlyDollarBudgetStatus>({
    queryKey: operatorQueryKeys.llmMonthlyBudgetStatus,
    queryFn: fetchLlmMonthlyDollarBudgetStatus,
    enabled: options?.enabled ?? true,
    refetchInterval: (query) => {
      if (options?.refetchIntervalMs !== undefined) {
        if (!options.refetchIntervalMs || options.documentHidden === true) {
          return false;
        }

        return options.refetchIntervalMs;
      }

      return resolveShellBannerPollIntervalMs({
        enabled: options?.enabled ?? true,
        documentHidden: options?.documentHidden ?? false,
        shouldPoll: options?.shouldPoll?.(query.state.data) ?? false,
        intervalMs: options?.intervalMs,
      });
    },
    refetchIntervalInBackground: false,
    staleTime: (query) => resolveLlmMonthlyBudgetStatusStaleTime(query.state.data),
  });
}

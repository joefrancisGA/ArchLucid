"use client";

import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useLlmMonthlyBudgetStatusQuery } from "@/hooks/use-llm-monthly-budget-status-query";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";

export type { LlmMonthlyDollarBudgetStatus };

/**
 * Loads tenant LLM monthly dollar gate state for run creation. On fetch failure, fails open (does not block runs)
 * so transient API errors do not strand operators.
 */
export function useLlmMonthlyBudgetExecutionGate(): {
  loading: boolean;
  status: LlmMonthlyDollarBudgetStatus | null;
  blocksLlmExecution: boolean;
} {
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const query = useLlmMonthlyBudgetStatusQuery({
    enabled: concernFetchEnabled,
  });

  const status = query.data ?? null;
  const loading = concernFetchEnabled && query.isPending && status === null;

  const blocksLlmExecution =
    status !== null &&
    status.monthlyBudgetMonitoringActive === true &&
    status.blocksAdditionalLlmExecution === true;

  return { loading, status, blocksLlmExecution };
}

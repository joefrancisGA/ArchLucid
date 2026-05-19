import { useEffect, useState } from "react";

import {
  fetchLlmMonthlyDollarBudgetStatusCached,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";

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
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<LlmMonthlyDollarBudgetStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchLlmMonthlyDollarBudgetStatusCached();

        if (!cancelled) {
          setStatus(data);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const blocksLlmExecution =
    status !== null &&
    status.monthlyBudgetMonitoringActive === true &&
    status.blocksAdditionalLlmExecution === true;

  return { loading, status, blocksLlmExecution };
}

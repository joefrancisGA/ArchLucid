import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";

const LLM_MONTHLY_DOLLAR_BUDGET_STATUS_PATH = "/v1/admin/llm-monthly-dollar-budget-status";

/** Mirrors `GET /v1/admin/llm-monthly-dollar-budget-status` (camelCase JSON). */
export type LlmMonthlyDollarBudgetStatus = {
  monthlyBudgetMonitoringActive: boolean;
  blocksAdditionalLlmExecution: boolean;
  utcMonth: string;
  hardCutoffUsdPerUtcMonth: number | null;
  effectiveHardCapUsd: number | null;
  purchasedCapBumpUsd: number | null;
  estimatedUsdPressure: number | null;
  assumedNextCallReservationUsd: number | null;
};

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
        const data = await apiGet<LlmMonthlyDollarBudgetStatus>(LLM_MONTHLY_DOLLAR_BUDGET_STATUS_PATH);

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

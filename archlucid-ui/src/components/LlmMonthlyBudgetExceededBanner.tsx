"use client";

import type { LlmMonthlyDollarBudgetStatus } from "@/hooks/use-llm-monthly-budget-execution-gate";

export type LlmMonthlyBudgetExceededBannerProps = {
  status: LlmMonthlyDollarBudgetStatus;
};

/** Inline warning when the tenant has exhausted the configured UTC-month LLM dollar hard cap. */
export function LlmMonthlyBudgetExceededBanner(props: LlmMonthlyBudgetExceededBannerProps) {
  const { status } = props;

  if (!status.monthlyBudgetMonitoringActive || !status.blocksAdditionalLlmExecution) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-amber-300/90 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-100"
      role="alert"
      data-testid="llm-monthly-budget-exceeded-banner"
    >
      LLM Execution budget exceeded for this month. You may still view previous runs.
      {status.utcMonth.length > 0 ? (
        <span className="block text-xs text-amber-900/90 dark:text-amber-200/90">
          UTC month: {status.utcMonth}
        </span>
      ) : null}
    </div>
  );
}

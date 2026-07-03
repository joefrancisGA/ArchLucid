"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
      className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 px-3 py-2", OPERATOR_TYPOGRAPHY.body)}
      role="alert"
      data-testid="llm-monthly-budget-exceeded-banner"
    >
      LLM Execution budget exceeded for this month. You may still view previous reviews.
      {status.utcMonth.length > 0 ? (
        <span className={cn("block text-amber-900/90 dark:text-amber-200/90", OPERATOR_TYPOGRAPHY.helper)}>
          UTC month: {status.utcMonth}
        </span>
      ) : null}
    </div>
  );
}

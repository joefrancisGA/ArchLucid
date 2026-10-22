"use client";

import Link from "next/link";

import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatTrialAiBudgetRemainingCopy } from "@/lib/llm-monthly-budget-status";
import { cn } from "@/lib/utils";

export type AiBudgetSpendNoticeProps = {
  /** Sentence-case name of the action that spends budget, for example "Architecture reasoning". */
  readonly action: string;
  /** Pre-flight estimate for the pending action, when the caller has one. */
  readonly estimatedCostUsd?: number | null;
  readonly className?: string;
  readonly testId?: string;
};

/**
 * Tells the operator that an advanced AI action draws on metered budget, and how much is left this
 * UTC month. Renders nothing when monthly budget monitoring is inactive, so hosts running without a
 * budget policy do not show an empty allowance.
 */
export function AiBudgetSpendNotice(props: AiBudgetSpendNoticeProps) {
  const { status, blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const testId = props.testId ?? "ai-budget-spend-notice";

  if (status === null || status.monthlyBudgetMonitoringActive !== true) {
    return null;
  }

  if (blocksLlmExecution) {
    return (
      <p
        role="alert"
        data-testid={`${testId}-blocked`}
        className={cn(
          "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary",
          OPERATOR_TYPOGRAPHY.body,
          props.className,
        )}
      >
        {`The AI budget for this workspace is exhausted, so ${lowerFirst(props.action)} is unavailable. `}
        <Link href={AI_USAGE_SETTINGS_PATH} className={OPERATOR_LINK.inline}>
          Review AI usage
        </Link>
      </p>
    );
  }

  return (
    <p
      data-testid={testId}
      className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body, props.className)}
    >
      {`${props.action} uses AI budget.`}
      {formatEstimateClause(props.estimatedCostUsd)}
      {formatRemainingClause(status.remainingBudgetUsd)}
    </p>
  );
}

function formatEstimateClause(estimatedCostUsd: number | null | undefined): string {
  if (typeof estimatedCostUsd !== "number" || Number.isNaN(estimatedCostUsd)) {
    return "";
  }

  return ` Estimated cost: $${estimatedCostUsd.toFixed(2)}.`;
}

function formatRemainingClause(remainingUsd: number | null | undefined): string {
  if (typeof remainingUsd !== "number" || Number.isNaN(remainingUsd)) {
    return "";
  }

  return ` ${formatTrialAiBudgetRemainingCopy(remainingUsd)} this month.`;
}

function lowerFirst(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return value.charAt(0).toLowerCase() + value.slice(1);
}

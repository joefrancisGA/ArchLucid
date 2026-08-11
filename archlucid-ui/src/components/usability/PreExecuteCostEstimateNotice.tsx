"use client";

import type { ReactElement } from "react";

import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildPreExecuteCostEstimateTeaching,
  PRE_EXECUTE_COST_ESTIMATE_TITLE,
  type PreExecuteCostEstimateInput,
} from "@/lib/pre-execute-cost-estimate";
import { cn } from "@/lib/utils";

export type PreExecuteCostEstimateNoticeProps = {
  /**
   * Optional Real-mode cost preview fields (same shape as RunWizardCostPreviewCard payload).
   * When omitted, the notice speaks included allowance only, without inventing dollars.
   */
  readonly estimate?: Pick<
    PreExecuteCostEstimateInput,
    | "previewActive"
    | "estimatedCostUsd"
    | "estimatedCostUsdLow"
    | "estimatedCostUsdHigh"
    | "pricingUsesIllustrativeUsdRates"
  > | null;
  /** When set, skips the monthly budget gate for remaining allotment. */
  readonly remainingBudgetUsd?: number | null;
  readonly monthlyBudgetMonitoringActive?: boolean | null;
  /**
   * When true (default), load remaining allotment from the shared monthly budget gate
   * unless remaining/monitoring props are supplied.
   */
  readonly useBudgetGate?: boolean;
  readonly className?: string;
  readonly testId?: string;
};

/**
 * Pre-execute "Included AI usage" teaching (TB-2233).
 * Composes optional cost-preview estimate fields with AiBudgetSpendNotice's allowance gate —
 * never invents USD when preview is inactive.
 */
export function PreExecuteCostEstimateNotice(
  props: PreExecuteCostEstimateNoticeProps,
): ReactElement {
  const useBudgetGate = props.useBudgetGate !== false;
  const budgetPropsProvided =
    props.remainingBudgetUsd !== undefined || props.monthlyBudgetMonitoringActive !== undefined;
  const { status } = useLlmMonthlyBudgetExecutionGate();

  const remainingBudgetUsd = budgetPropsProvided
    ? (props.remainingBudgetUsd ?? null)
    : useBudgetGate
      ? (status?.remainingBudgetUsd ?? null)
      : null;

  const monthlyBudgetMonitoringActive = budgetPropsProvided
    ? (props.monthlyBudgetMonitoringActive ?? null)
    : useBudgetGate
      ? (status?.monthlyBudgetMonitoringActive ?? null)
      : null;

  const teaching = buildPreExecuteCostEstimateTeaching({
    previewActive: props.estimate?.previewActive ?? false,
    estimatedCostUsd: props.estimate?.estimatedCostUsd ?? null,
    estimatedCostUsdLow: props.estimate?.estimatedCostUsdLow ?? null,
    estimatedCostUsdHigh: props.estimate?.estimatedCostUsdHigh ?? null,
    pricingUsesIllustrativeUsdRates: props.estimate?.pricingUsesIllustrativeUsdRates ?? null,
    remainingBudgetUsd,
    monthlyBudgetMonitoringActive,
  });

  const testId = props.testId ?? "pre-execute-cost-estimate-notice";

  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.neutral, "space-y-1 p-4", props.className)}
      data-testid={testId}
      data-kind={teaching.kind}
      aria-labelledby={`${testId}-heading`}
    >
      <h2
        id={`${testId}-heading`}
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {PRE_EXECUTE_COST_ESTIMATE_TITLE}
      </h2>
      <p
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid={`${testId}-message`}
      >
        {teaching.message}
      </p>
      {teaching.honestyNote !== null ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${testId}-honesty`}
        >
          {teaching.honestyNote}
        </p>
      ) : null}
    </aside>
  );
}

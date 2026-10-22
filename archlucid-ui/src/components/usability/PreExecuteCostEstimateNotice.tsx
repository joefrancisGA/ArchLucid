"use client";

import type { ReactElement } from "react";

import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildPreExecuteCostEstimateTeaching,
  PRE_EXECUTE_COST_ESTIMATE_TITLE,
  type PreExecuteCostEstimateInput,
  type PreExecuteCostEstimateKind,
} from "@/lib/pre-execute-cost-estimate";
import { cn } from "@/lib/utils";

/**
 * Allowance-only states assert no dollar figure, so they carry no decision for the operator.
 * They render as a quiet line rather than a bordered callout competing with the primary CTA.
 */
function isInlinePresentation(kind: PreExecuteCostEstimateKind): boolean {
  return kind === "allotment" || kind === "unknown";
}

function shellClassName(inline: boolean): string {
  return inline ? "space-y-1" : cn(DESIGN_TOKENS.callout.neutral, "space-y-1 p-4");
}

function messageClassName(inline: boolean): string {
  return inline
    ? cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)
    : cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body);
}

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
  const inline = isInlinePresentation(teaching.kind);

  return (
    <aside
      className={cn(shellClassName(inline), props.className)}
      data-testid={testId}
      data-kind={teaching.kind}
      data-presentation={inline ? "inline" : "callout"}
      aria-label={PRE_EXECUTE_COST_ESTIMATE_TITLE}
      // aria-labelledby wins over aria-label when the visible heading is rendered.
      aria-labelledby={inline ? undefined : `${testId}-heading`}
    >
      {inline ? null : (
        <h2
          id={`${testId}-heading`}
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {PRE_EXECUTE_COST_ESTIMATE_TITLE}
        </h2>
      )}
      <p className={messageClassName(inline)} data-testid={`${testId}-message`}>
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

import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import { llmBudgetRemainingPercent } from "@/lib/llm-monthly-budget-status";

/** CG-095 — shell budget pill is cost control, not Career/Rehearsal execute posture. */
export const LLM_BUDGET_STATUS_PILL_CAREER_HONESTY_TITLE = "Cost control — not execute posture";

export const LLM_BUDGET_STATUS_PILL_CAREER_HONESTY_BODY =
  "Monthly LLM budget caps new AI calls when headroom is low. It is not the Record or Practice review type — open a review workspace for execute posture on sealed records.";

export const LLM_BUDGET_STATUS_PILL_AT_CAP_SUFFIX = "at cap";

export function isLlmBudgetStatusPillAtCap(status: LlmMonthlyDollarBudgetStatus): boolean {
  return (
    status.blocksAdditionalLlmExecution ||
    (status.hardCapUtilizationFraction !== null && status.hardCapUtilizationFraction >= 1)
  );
}

export function buildLlmBudgetStatusPillLabel(
  status: LlmMonthlyDollarBudgetStatus,
  remainingPercent: number | null,
): string {
  const display = remainingPercent !== null ? `${remainingPercent}%` : " — ";

  if (isLlmBudgetStatusPillAtCap(status)) {
    return `AI budget: ${display} — ${LLM_BUDGET_STATUS_PILL_AT_CAP_SUFFIX}`;
  }

  return `AI budget: ${display}`;
}

export function buildLlmBudgetStatusPillAriaLabel(
  remainingPercent: number | null,
  atCap: boolean,
): string {
  if (remainingPercent === null) {
    return "Monthly LLM budget allowance";
  }

  if (atCap) {
    return `Monthly LLM budget allowance: ${remainingPercent}% remaining, budget cap reached — new AI calls blocked`;
  }

  return `Monthly LLM budget allowance: ${remainingPercent}% remaining`;
}

export function resolveLlmBudgetStatusPillPresentation(status: LlmMonthlyDollarBudgetStatus): {
  readonly remainingPercent: number | null;
  readonly atCap: boolean;
  readonly label: string;
  readonly ariaLabel: string;
} {
  const remainingPercent = llmBudgetRemainingPercent(status);
  const atCap = isLlmBudgetStatusPillAtCap(status);

  return {
    remainingPercent,
    atCap,
    label: buildLlmBudgetStatusPillLabel(status, remainingPercent),
    ariaLabel: buildLlmBudgetStatusPillAriaLabel(remainingPercent, atCap),
  };
}

import {
  llmBudgetUtilizationPercent,
  resolveLlmBudgetUtilizationTone,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";

export type LlmBudgetCommandCenterDisposition = "PASS" | "WARN" | "HOLD";

export type LlmBudgetCommandCenterSummary = {
  readonly disposition: LlmBudgetCommandCenterDisposition;
  readonly utilizationPercent: number | null;
  readonly summary: string;
};

/** Maps monthly budget status to command-center PASS/WARN/HOLD (#14). */
export function buildLlmBudgetCommandCenterSummary(
  status: LlmMonthlyDollarBudgetStatus | null,
): LlmBudgetCommandCenterSummary | null {
  if (status === null || !status.monthlyBudgetMonitoringActive)
    return null;

  const utilizationPercent = llmBudgetUtilizationPercent(status);
  const tone = resolveLlmBudgetUtilizationTone(status);

  if (tone === "critical" || status.blocksAdditionalLlmExecution) {
    return {
      disposition: "HOLD",
      utilizationPercent,
      summary: "UTC-month LLM hard cap reached — new LLM execution may be blocked until the next month or cap bump.",
    };
  }

  if (tone === "warn") {
    const warnPct =
      status.warnFraction !== null && status.warnFraction !== undefined
        ? Math.round(status.warnFraction * 100)
        : null;

    return {
      disposition: "WARN",
      utilizationPercent,
      summary:
        warnPct !== null
          ? `Approaching LLM warn threshold (${warnPct}% of configured cap).`
          : "Approaching LLM warn threshold for the UTC month.",
    };
  }

  return {
    disposition: "PASS",
    utilizationPercent,
    summary: "UTC-month LLM utilization is within configured warn and hard-cap bands.",
  };
}

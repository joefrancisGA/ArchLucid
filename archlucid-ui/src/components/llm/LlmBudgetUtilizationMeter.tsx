"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Progress } from "@/components/ui/progress";
import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useLlmMonthlyBudgetStatusQuery } from "@/hooks/use-llm-monthly-budget-status-query";
import {
  llmBudgetUtilizationPercent,
  resolveLlmBudgetUtilizationTone,
  type LlmBudgetUtilizationTone,
} from "@/lib/llm-monthly-budget-status";
import { formatUtcBillingMonthLabel } from "@/lib/llm-cost-reporting-display-labels";

/** UTC-month LLM dollar hard-cap utilization for operator settings and dashboards. */
export function LlmBudgetUtilizationMeter() {
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const { data: status, isPending, isError } = useLlmMonthlyBudgetStatusQuery({
    enabled: concernFetchEnabled,
  });

  if (isPending) {
    return (
      <p
        className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        data-testid="llm-budget-utilization-loading"
      >
        Loading budget utilization…
      </p>
    );
  }

  if (isError) {
    return (
      <p
        className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        data-testid="llm-budget-utilization-unavailable"
      >
        Monthly budget status is unavailable right now.
      </p>
    );
  }

  if (status === undefined || !status.monthlyBudgetMonitoringActive) {
    return (
      <p
        className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        data-testid="llm-budget-utilization-inactive"
      >
        Monthly AI budget monitoring is not enabled for this workspace.
      </p>
    );
  }

  const pct = llmBudgetUtilizationPercent(status);
  const tone = resolveLlmBudgetUtilizationTone(status);
  const warnPct =
    status.warnFraction !== null && status.warnFraction !== undefined
      ? Math.round(status.warnFraction * 100)
      : null;
  const indicatorClassName = indicatorClassForTone(tone);
  const statusText =
    tone === "critical"
      ? "Monthly budget reached — new AI-assisted workflows may be paused until the next billing month."
      : tone === "warn"
        ? `Approaching the configured warn threshold (${warnPct ?? " — "}% of budget).`
        : "Monthly budget utilization is within normal limits.";
  const labelId = "llm-budget-utilization-label";
  const displayPct = pct ?? 0;

  return (
    <div data-testid="llm-budget-utilization-meter">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p id={labelId} className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {formatUtcBillingMonthLabel()}
        </p>
        <p
          className={cn(
            "m-0 font-semibold tabular-nums",
            OPERATOR_TYPOGRAPHY.cardTitle,
            tone === "critical"
              ? "text-rose-700 dark:text-rose-300"
              : tone === "warn"
                ? "text-amber-800 dark:text-amber-200"
                : "text-al-text-secondary dark:text-neutral-300",
          )}
          aria-live="polite"
        >
          {pct !== null ? `${pct}% used` : " — "}
        </p>
      </div>
      <Progress
        value={displayPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayPct}
        aria-labelledby={labelId}
        indicatorClassName={indicatorClassName}
        className="mt-2"
      />
      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
        {statusText}
        {status.effectiveHardCapUsd !== null ? (
          <span className={cn("mt-1 block tabular-nums text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            Budget used: {formatUsd(status.estimatedUsdPressure)} of {formatUsd(status.effectiveHardCapUsd)}
            {status.purchasedCapBumpUsd !== null && status.purchasedCapBumpUsd > 0
              ? ` (includes +${formatUsd(status.purchasedCapBumpUsd)} purchased allowance)`
              : ""}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function indicatorClassForTone(tone: LlmBudgetUtilizationTone): string {
  if (tone === "critical") {
    return "bg-rose-600 dark:bg-rose-500";
  }

  if (tone === "warn") {
    return "bg-amber-500 dark:bg-amber-400";
  }

  return "bg-teal-700 dark:bg-teal-500";
}

function formatUsd(value: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return " — ";
  }

  return `$${value.toFixed(2)}`;
}

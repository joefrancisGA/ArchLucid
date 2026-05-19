"use client";

import { useEffect, useState } from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  fetchLlmMonthlyDollarBudgetStatusCached,
  llmBudgetUtilizationPercent,
  resolveLlmBudgetUtilizationTone,
  type LlmBudgetUtilizationTone,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";

export type LlmBudgetUtilizationMeterProps = {
  /** When set, re-fetches on change (e.g. parent refresh button). */
  readonly refreshToken?: number;
};

/** UTC-month LLM dollar hard-cap utilization for operator settings and dashboards. */
export function LlmBudgetUtilizationMeter(props: LlmBudgetUtilizationMeterProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<LlmMonthlyDollarBudgetStatus | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setLoadError(false);

      try {
        const data = await fetchLlmMonthlyDollarBudgetStatusCached({
          force: props.refreshToken !== undefined && props.refreshToken > 0,
        });

        if (!cancelled) {
          setStatus(data);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
          setLoadError(true);
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
  }, [props.refreshToken]);

  if (loading) {
    return (
      <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400" data-testid="llm-budget-utilization-loading">
        Loading LLM budget utilization…
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" data-testid="llm-budget-utilization-unavailable">
        LLM monthly budget status is unavailable right now.
      </p>
    );
  }

  if (status === null || !status.monthlyBudgetMonitoringActive) {
    return (
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" data-testid="llm-budget-utilization-inactive">
        Monthly LLM dollar budget monitoring is not enabled for this environment.
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
      ? "At or over hard cap — new LLM runs may be blocked."
      : tone === "warn"
        ? `Approaching warn threshold (${warnPct ?? "—"}% of cap).`
        : "Within normal utilization.";
  const labelId = "llm-budget-utilization-label";
  const displayPct = pct ?? 0;

  return (
    <div data-testid="llm-budget-utilization-meter">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p id={labelId} className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          LLM budget utilization (UTC month {status.utcMonth})
        </p>
        <p
          className={cn(
            "m-0 text-sm font-semibold tabular-nums",
            tone === "critical"
              ? "text-rose-700 dark:text-rose-300"
              : tone === "warn"
                ? "text-amber-800 dark:text-amber-200"
                : "text-teal-800 dark:text-teal-300",
          )}
          aria-live="polite"
        >
          {pct !== null ? `${pct}%` : "—"} of cap
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
      <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400" role="status">
        {statusText}
        {status.effectiveHardCapUsd !== null ? (
          <span className="block font-mono text-[11px] text-neutral-500 dark:text-neutral-500">
            Estimated pressure {formatUsd(status.estimatedUsdPressure)} / cap {formatUsd(status.effectiveHardCapUsd)}
            {status.purchasedCapBumpUsd !== null && status.purchasedCapBumpUsd > 0
              ? ` (includes +${formatUsd(status.purchasedCapBumpUsd)} purchased bump)`
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
    return "—";
  }

  return `$${value.toFixed(2)}`;
}

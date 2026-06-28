"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLlmMonthlyBudgetStatusQuery } from "@/hooks/use-llm-monthly-budget-status-query";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  llmBudgetUtilizationPercent,
  resolveLlmBudgetUtilizationTone,
} from "@/lib/llm-monthly-budget-status";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { cn } from "@/lib/utils";

const LLM_BUDGET_WARN_POLL_MS = 60_000;

/**
 * Global warning when UTC-month LLM dollar utilization crosses the configured warn fraction (default 75%).
 * Dismiss hides the banner for the current browser session only.
 */
export function LlmBudgetApproachingLimitBanner() {
  const [dismissed, setDismissed] = useState(false);
  const queryEnabled =
    !dismissed &&
    !isNextPublicDemoMode() &&
    !isStaticDemoPayloadFallbackEnabled() &&
    !isBuyerPolishedOperatorShellEnv();

  const { data: status } = useLlmMonthlyBudgetStatusQuery({
    enabled: queryEnabled,
    refetchIntervalMs: queryEnabled ? LLM_BUDGET_WARN_POLL_MS : false,
  });

  const visible = useMemo(() => {
    if (!status?.monthlyBudgetMonitoringActive) {
      return false;
    }

    const tone = resolveLlmBudgetUtilizationTone(status);

    return tone === "warn" || tone === "critical";
  }, [status]);

  if (!queryEnabled || !visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-4 py-3 text-al-text-primary shadow-sm dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="alert"
      data-testid="llm-budget-approaching-limit-banner"
    >
      <div>
        <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">
          Approaching monthly LLM budget limit. Reviews may be paused soon.
        </p>
        <p className={cn("m-0 mt-1 leading-snug text-amber-900/90 dark:text-amber-200/90", OPERATOR_TYPOGRAPHY.helper)}>
          Review utilization in{" "}
          <Link href={AI_USAGE_SETTINGS_PATH} className={OPERATOR_LINK.nav}>
            Settings → Cost reporting
          </Link>
          .
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/60"
        aria-label="Dismiss LLM budget warning for this session"
        onClick={() => {
          setDismissed(true);
        }}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

/** Exported for tests — whether utilization crosses the warn threshold. */
export function shouldShowLlmBudgetApproachingBanner(
  status: Parameters<typeof resolveLlmBudgetUtilizationTone>[0],
): boolean {
  if (!status.monthlyBudgetMonitoringActive) {
    return false;
  }

  const tone = resolveLlmBudgetUtilizationTone(status);
  const pct = llmBudgetUtilizationPercent(status);

  return (tone === "warn" || tone === "critical") && pct !== null;
}

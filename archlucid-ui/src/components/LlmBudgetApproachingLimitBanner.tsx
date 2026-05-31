"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  fetchLlmMonthlyDollarBudgetStatusCached,
  llmBudgetUtilizationPercent,
  resolveLlmBudgetUtilizationTone,
} from "@/lib/llm-monthly-budget-status";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

const LLM_BUDGET_WARN_POLL_MS = 60_000;

/**
 * Global warning when UTC-month LLM dollar utilization crosses the configured warn fraction (default 75%).
 * Dismiss hides the banner for the current browser session only.
 */
export function LlmBudgetApproachingLimitBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (
      dismissed ||
      isNextPublicDemoMode() ||
      isStaticDemoPayloadFallbackEnabled() ||
      isBuyerPolishedOperatorShellEnv()
    ) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const status = await fetchLlmMonthlyDollarBudgetStatusCached();

        if (cancelled) {
          return;
        }

        if (!status.monthlyBudgetMonitoringActive) {
          setVisible(false);

          return;
        }

        const tone = resolveLlmBudgetUtilizationTone(status);

        setVisible(tone === "warn" || tone === "critical");
      } catch {
        if (!cancelled) {
          setVisible(false);
        }
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, LLM_BUDGET_WARN_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [dismissed]);

  if (
    dismissed ||
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    isBuyerPolishedOperatorShellEnv() ||
    !visible
  ) {
    return null;
  }

  return (
    <div
      className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 px-4 py-3 text-sm shadow-sm"
      role="alert"
      data-testid="llm-budget-approaching-limit-banner"
    >
      <div>
        <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">
          Approaching monthly LLM budget limit. Runs may be paused soon.
        </p>
        <p className="m-0 mt-1 text-xs leading-snug text-amber-900/90 dark:text-amber-200/90">
          Review utilization in{" "}
          <Link href="/settings/cost-reporting" className="font-medium underline underline-offset-2">
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
          setVisible(false);
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

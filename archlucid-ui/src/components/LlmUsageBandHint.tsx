"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  fetchLlmMonthlyDollarBudgetStatusCached,
  formatBuyerLlmUsageApproachingCopy,
  formatBuyerLlmUsageExhaustedCopy,
  llmBudgetRemainingPercent,
  shouldShowBuyerLlmUsageBandHint,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

const LLM_USAGE_BAND_POLL_MS = 60_000;

/**
 * Buyer-polished shell hint for UTC-month AI analysis budget headroom. Shows approximate percent remaining
 * (not dollar amounts) when utilization crosses the warn threshold; shows a persistent exhausted banner at hard cap.
 */
export function LlmUsageBandHint() {
  const [status, setStatus] = useState<LlmMonthlyDollarBudgetStatus | null>(null);

  useEffect(() => {
    if (
      !isBuyerPolishedOperatorShellEnv() ||
      isNextPublicDemoMode() ||
      isStaticDemoPayloadFallbackEnabled()
    ) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const nextStatus = await fetchLlmMonthlyDollarBudgetStatusCached();

        if (!cancelled) {
          setStatus(nextStatus);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
        }
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, LLM_USAGE_BAND_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (
    !isBuyerPolishedOperatorShellEnv() ||
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    status === null ||
    !shouldShowBuyerLlmUsageBandHint(status)
  ) {
    return null;
  }

  const remainingPercent = llmBudgetRemainingPercent(status);
  const exhausted = status.blocksAdditionalLlmExecution === true;

  if (exhausted) {
    return (
      <div
        className="rounded-lg border border-rose-300/90 bg-rose-50/95 px-4 py-3 text-sm text-rose-950 shadow-sm dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-50"
        role="alert"
        data-testid="llm-usage-band-hint-exhausted"
      >
        <p className="m-0 font-semibold leading-snug">{formatBuyerLlmUsageExhaustedCopy()}</p>
        <p className="m-0 mt-1 text-xs leading-snug">
          <Link href="/pricing#pricing-quote-request" className="font-medium underline underline-offset-2">
            View pricing and request a quote
          </Link>
          {" · "}
          You can still open committed reviews and exports from earlier in this trial month.
        </p>
      </div>
    );
  }

  if (remainingPercent === null) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-amber-300/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-50"
      role="status"
      data-testid="llm-usage-band-hint-approaching"
    >
      <p className="m-0 leading-snug">{formatBuyerLlmUsageApproachingCopy(remainingPercent)}</p>
      <p className="m-0 mt-1 text-xs leading-snug">
        <Link href="/pricing#pricing-quote-request" className="font-medium underline underline-offset-2">
          Talk to us about upgrading
        </Link>
      </p>
    </div>
  );
}

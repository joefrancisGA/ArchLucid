"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LlmBudgetUtilizationMeter } from "@/components/LlmBudgetUtilizationMeter";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AUTH_MODE } from "@/lib/auth-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  fetchLlmMonthlyDollarBudgetStatusCached,
  llmBudgetRemainingPercent,
  resolveLlmBudgetUtilizationTone,
  type LlmBudgetUtilizationTone,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { cn } from "@/lib/utils";

function pillClassForTone(tone: LlmBudgetUtilizationTone): string {
  if (tone === "critical") {
    return "border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100 dark:hover:bg-rose-950/70";
  }

  if (tone === "warn") {
    return "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50 dark:hover:bg-amber-950/60";
  }

  return "border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100 dark:hover:bg-teal-950/60";
}

function buildPillLabel(status: LlmMonthlyDollarBudgetStatus, remainingPercent: number | null): string {
  const display = remainingPercent !== null ? `${remainingPercent}%` : "—";
  const paused =
    status.blocksAdditionalLlmExecution ||
    (status.hardCapUtilizationFraction !== null && status.hardCapUtilizationFraction >= 1);

  return paused ? `AI budget: ${display} left — paused` : `AI budget: ${display} left`;
}

function buildPillAriaLabel(remainingPercent: number | null, paused: boolean): string {
  if (remainingPercent === null) {
    return "AI analysis budget for this month";
  }

  if (paused) {
    return `AI analysis budget for this month: ${remainingPercent}% left, new runs paused`;
  }

  return `AI analysis budget for this month: ${remainingPercent}% left`;
}

function isOperatorShellAuthenticated(): boolean {
  if (AUTH_MODE === "development-bypass") {
    return true;
  }

  if (isJwtAuthMode()) {
    return isLikelySignedIn();
  }

  return true;
}

/** Compact UTC-month LLM budget indicator for the operator shell top bar. */
export function LlmBudgetStatusPill() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<LlmMonthlyDollarBudgetStatus | null>(null);

  useEffect(() => {
    if (
      isBuyerPolishedOperatorShellEnv() ||
      isAuthorityLoading ||
      !isOperatorShellAuthenticated() ||
      callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
    ) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchLlmMonthlyDollarBudgetStatusCached();

        if (!cancelled) {
          setStatus(data);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [callerAuthorityRank, isAuthorityLoading]);

  if (
    isBuyerPolishedOperatorShellEnv() ||
    isAuthorityLoading ||
    !isOperatorShellAuthenticated() ||
    callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
  ) {
    return null;
  }

  if (status === null || !status.monthlyBudgetMonitoringActive) {
    return null;
  }

  const tone = resolveLlmBudgetUtilizationTone(status);
  const remainingPercent = llmBudgetRemainingPercent(status);
  const paused =
    status.blocksAdditionalLlmExecution ||
    (status.hardCapUtilizationFraction !== null && status.hardCapUtilizationFraction >= 1);
  const label = buildPillLabel(status, remainingPercent);
  const ariaLabel = buildPillAriaLabel(remainingPercent, paused);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-7 shrink-0 border px-2.5 text-xs font-semibold tabular-nums", pillClassForTone(tone))}
            data-testid="llm-budget-status-pill"
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent data-testid="llm-budget-status-pill-popover">
          <LlmBudgetUtilizationMeter />
          <p className="m-0 mt-3 text-xs">
            <Link href="/settings/cost-reporting" className="font-medium text-teal-800 underline dark:text-teal-300">
              Manage budget
            </Link>
          </p>
        </PopoverContent>
      </div>
    </Popover>
  );
}

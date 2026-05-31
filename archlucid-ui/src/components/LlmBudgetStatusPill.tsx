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
import { enterpriseStatusTagClass } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function pillClassForTone(tone: LlmBudgetUtilizationTone): string {
  const hover = "hover:bg-[var(--al-layer-hover)] dark:hover:bg-neutral-800/80";

  if (tone === "critical") {
    return cn(enterpriseStatusTagClass("blocked"), hover);
  }

  if (tone === "warn") {
    return cn(enterpriseStatusTagClass("needs-attention"), hover);
  }

  return cn(enterpriseStatusTagClass("ready"), hover);
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

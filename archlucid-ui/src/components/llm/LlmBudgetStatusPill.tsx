"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LlmBudgetUtilizationMeter } from "@/components/llm/LlmBudgetUtilizationMeter";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AUTH_MODE } from "@/lib/auth-config";
import {
  fetchLlmMonthlyDollarBudgetStatusCached,
  llmBudgetRemainingPercent,
  resolveLlmBudgetUtilizationTone,
  shouldShowShellLlmBudgetStatusPill,
  type LlmBudgetUtilizationTone,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { enterpriseStatusTagClass, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

  return paused ? `AI budget: ${display} — paused` : `AI budget: ${display}`;
}

function buildPillAriaLabel(remainingPercent: number | null, paused: boolean): string {
  if (remainingPercent === null) {
    return "Monthly LLM budget allowance";
  }

  if (paused) {
    return `Monthly LLM budget allowance: ${remainingPercent}% remaining, new reviews paused`;
  }

  return `Monthly LLM budget allowance: ${remainingPercent}% remaining`;
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
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<LlmMonthlyDollarBudgetStatus | null>(null);

  useEffect(() => {
    if (!isOperatorShellAuthenticated() || callerAuthorityRank < AUTHORITY_RANK.AdminAuthority) {
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
  }, [callerAuthorityRank]);

  if (!isOperatorShellAuthenticated() || callerAuthorityRank < AUTHORITY_RANK.AdminAuthority) {
    return null;
  }

  if (status === null || !status.monthlyBudgetMonitoringActive) {
    return null;
  }

  if (!shouldShowShellLlmBudgetStatusPill(status)) {
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
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-6 shrink-0 border px-1.5 font-normal tabular-nums text-neutral-600 dark:text-neutral-300",
            OPERATOR_TYPOGRAPHY.micro,
            pillClassForTone(tone),
          )}
          data-testid="llm-budget-status-pill"
          aria-label={ariaLabel}
        >
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent data-testid="llm-budget-status-pill-popover">
        <LlmBudgetUtilizationMeter />
        <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href={AI_USAGE_SETTINGS_PATH} className={OPERATOR_LINK.nav}>
            Open AI usage and budget
          </Link>
          {" · "}
          <Link href="/administration/billing#billing-usage" className={OPERATOR_LINK.nav}>
            Billing &amp; plans
          </Link>
        </p>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type SetStateAction } from "react";

import { LlmBudgetUtilizationMeter } from "@/components/llm/LlmBudgetUtilizationMeter";
import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useLlmMonthlyBudgetStatusQuery } from "@/hooks/use-llm-monthly-budget-status-query";
import { AUTH_MODE } from "@/lib/auth-config";
import { shouldShowShellLlmBudgetStatusPill } from "@/lib/llm-monthly-budget-status";
import {
  LLM_BUDGET_STATUS_PILL_CAREER_HONESTY_BODY,
  LLM_BUDGET_STATUS_PILL_CAREER_HONESTY_TITLE,
  resolveLlmBudgetStatusPillPresentation,
} from "@/lib/llm/llm-budget-status-pill-career-honesty";
import { resolveEnterpriseStatusKind } from "@/lib/enterprise-status-kind-resolver";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import {
  llmBudgetStatusPillHrefFromSearch,
  parseLlmBudgetStatusPillOpenFromSearch,
} from "@/lib/llm/llm-budget-status-pill-url";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { DESIGN_TOKENS, enterpriseStatusTagClass, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function pillClassForBudgetLabel(label: string): string {
  const hover = "hover:bg-[var(--al-layer-hover)] dark:hover:bg-neutral-800/80";

  return cn(enterpriseStatusTagClass(resolveEnterpriseStatusKind(label, "budget")), hover);
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const llmBudgetOpenParam = searchParams.get("llmBudgetOpen");
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const [open, setOpenState] = useState(() => parseLlmBudgetStatusPillOpenFromSearch(llmBudgetOpenParam));

  const syncLlmBudgetOpenToUrl = useCallback(
    (popoverOpen: boolean) => {
      router.replace(llmBudgetStatusPillHrefFromSearch(searchParams.toString(), popoverOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncLlmBudgetOpenToUrl(next);

        return next;
      });
    },
    [syncLlmBudgetOpenToUrl],
  );
  const queryEnabled =
    concernFetchEnabled &&
    isOperatorShellAuthenticated() &&
    callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const { data: status } = useLlmMonthlyBudgetStatusQuery({ enabled: queryEnabled });

  if (!queryEnabled) {
    return null;
  }

  if (status === undefined || !status.monthlyBudgetMonitoringActive) {
    return null;
  }

  if (!shouldShowShellLlmBudgetStatusPill(status)) {
    return null;
  }

  const presentation = resolveLlmBudgetStatusPillPresentation(status);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-6 shrink-0 border px-1.5 tabular-nums text-neutral-600 dark:text-neutral-300",
            pillClassForBudgetLabel(presentation.label),
          )}
          data-testid="llm-budget-status-pill"
          aria-label={presentation.ariaLabel}
        >
          {presentation.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent data-testid="llm-budget-status-pill-popover">
        <LlmBudgetUtilizationMeter />
        <div
          className={cn(DESIGN_TOKENS.callout.info, "mt-3 p-3")}
          data-testid="llm-budget-status-pill-career-honesty"
          role="status"
        >
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {LLM_BUDGET_STATUS_PILL_CAREER_HONESTY_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {LLM_BUDGET_STATUS_PILL_CAREER_HONESTY_BODY}
          </p>
        </div>
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

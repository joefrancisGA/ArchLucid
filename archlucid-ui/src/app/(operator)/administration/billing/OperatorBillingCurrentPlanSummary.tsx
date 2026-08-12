"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import {
  fetchLlmMonthlyDollarBudgetStatusCached,
  llmBudgetRemainingPercent,
  llmBudgetUtilizationPercent,
} from "@/lib/llm-monthly-budget-status";
import { BILLING_MONTHLY_AI_BUDGET_ALLOWANCE_LABEL } from "@/lib/vocabulary/billing-meter-vocabulary";
import { OPERATOR_BILLING_TIER_CTAS } from "@/lib/marketing/marketing-public-pricing";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { resolveOperatorBillingCurrentPlan } from "@/lib/operator/operator-billing-current-plan";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { BillingNextInvoicePlainEnglishNotice } from "@/components/billing/BillingNextInvoicePlainEnglishNotice";
import { useBillingSubscriptionStatusQuery } from "@/hooks/use-billing-subscription-status-query";
import { OperatorBillingManageBillingAction } from "./OperatorBillingManageBillingAction";

function readWorkspaceLabelFromStorage(): string | null {
  const scope = readOperatorScopeFromStorage();

  if (scope === null) {
    return null;
  }

  const label = scope.workspaceLabel.trim();

  return label.length > 0 ? label : null;
}

export function OperatorBillingCurrentPlanSummary() {
  const canMutate = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const { data: trialPayload } = useTenantTrialStatusQuery();
  const { data: subscriptionStatus } = useBillingSubscriptionStatusQuery();
  const [workspaceLabel, setWorkspaceLabel] = useState<string | null>(null);
  const [aiBudgetRemainingPercent, setAiBudgetRemainingPercent] = useState<number | null>(null);
  const [includedAiBudgetUsd, setIncludedAiBudgetUsd] = useState<number | null>(null);
  const [aiUsedPercent, setAiUsedPercent] = useState<number | null>(null);

  useEffect(() => {
    const syncScopeLabel = () => {
      setWorkspaceLabel(readWorkspaceLabelFromStorage());
    };

    syncScopeLabel();
    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, syncScopeLabel);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, syncScopeLabel);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const status = await fetchLlmMonthlyDollarBudgetStatusCached();

        if (!cancelled) {
          setAiBudgetRemainingPercent(llmBudgetRemainingPercent(status));
          setIncludedAiBudgetUsd(status.effectiveHardCapUsd);
          setAiUsedPercent(llmBudgetUtilizationPercent(status));
        }
      } catch {
        if (!cancelled) {
          setAiBudgetRemainingPercent(null);
          setIncludedAiBudgetUsd(null);
          setAiUsedPercent(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const view = useMemo(
    () =>
      resolveOperatorBillingCurrentPlan({
        isDemoMode: isNextPublicDemoMode(),
        isFrictionlessTrial:
          typeof window !== "undefined" ? readFrictionlessTrialSessionEnabled() : false,
        trialStatus: trialPayload?.status,
        trialDaysRemaining: trialPayload?.daysRemaining,
        workspaceLabel,
        aiBudgetRemainingPercent,
      }),
    [aiBudgetRemainingPercent, trialPayload?.daysRemaining, trialPayload?.status, workspaceLabel],
  );

  return (
    <Card data-testid="operator-billing-current-plan">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Current plan</CardTitle>
        <CardDescription>{view.supportingLine}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <dl className={cn("grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Plan</dt>
            <dd className="font-medium text-al-text-primary">{view.headline}</dd>
          </div>
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Status</dt>
            <dd className="font-medium text-al-text-primary">
              {view.hasPaidPlan ? "Active paid plan" : "No active subscription"}
            </dd>
          </div>
          {includedAiBudgetUsd !== null ? (
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">{BILLING_MONTHLY_AI_BUDGET_ALLOWANCE_LABEL}</dt>
              <dd className="font-medium tabular-nums text-al-text-primary">${includedAiBudgetUsd.toFixed(0)} / month</dd>
            </div>
          ) : null}
          {aiUsedPercent !== null ? (
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Used this month</dt>
              <dd className="font-medium tabular-nums text-al-text-primary">
                {aiUsedPercent}%{" "}
                <Link href="#billing-usage" className={cn(OPERATOR_TYPOGRAPHY.micro, OPERATOR_LINK.nav)}>
                  View details
                </Link>
              </dd>
            </div>
          ) : null}
          {view.aiBudgetRemainingPercent !== null ? (
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Remaining</dt>
              <dd className="font-medium tabular-nums text-al-text-primary">{view.aiBudgetRemainingPercent}% of plan allowance</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Workspaces</dt>
            <dd className="font-medium text-al-text-primary">{view.workspaceLabel ?? "1 workspace in scope"}</dd>
          </div>
        </dl>

        {!view.hasPaidPlan ? (
          <div className="flex flex-wrap gap-3">
            <Link href="#billing-plans" className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.body)}>
              {OPERATOR_BILLING_TIER_CTAS.architect.primaryLabel}
            </Link>
            <Link href="#billing-plans" className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.body)}>
              Compare available plans
            </Link>
          </div>
        ) : (
          <OperatorBillingManageBillingAction canMutate={canMutate} variant="outline" size="sm" />
        )}

        <BillingNextInvoicePlainEnglishNotice
          canMutate={canMutate}
          planLabel={view.headline}
          status={subscriptionStatus?.status}
          hasSubscription={subscriptionStatus?.hasSubscription ?? view.hasPaidPlan}
          provider={subscriptionStatus?.provider}
        />
      </CardContent>
    </Card>
  );
}

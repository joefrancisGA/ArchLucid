"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import {
  fetchLlmMonthlyDollarBudgetStatusCached,
  llmBudgetRemainingPercent,
} from "@/lib/llm-monthly-budget-status";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator-scope-storage";
import { resolveOperatorBillingCurrentPlan } from "@/lib/operator-billing-current-plan";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function readWorkspaceLabelFromStorage(): string | null {
  const scope = readOperatorScopeFromStorage();

  if (scope === null) {
    return null;
  }

  const label = scope.workspaceLabel.trim();

  return label.length > 0 ? label : null;
}

export function OperatorBillingCurrentPlanSummary() {
  const { data: trialPayload } = useTenantTrialStatusQuery();
  const [workspaceLabel, setWorkspaceLabel] = useState<string | null>(null);
  const [aiBudgetRemainingPercent, setAiBudgetRemainingPercent] = useState<number | null>(null);

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
        }
      } catch {
        if (!cancelled) {
          setAiBudgetRemainingPercent(null);
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
      <CardContent className="space-y-3 pt-0">
        <dl className={cn("grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Status</dt>
            <dd className="font-medium text-al-text-primary">{view.headline}</dd>
          </div>
          {view.aiBudgetRemainingPercent !== null ? (
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">AI budget</dt>
              <dd className="font-medium tabular-nums text-al-text-primary">
                {view.aiBudgetRemainingPercent}% remaining{" "}
                <Link
                  href="#billing-usage"
                  className={cn(OPERATOR_TYPOGRAPHY.micro, OPERATOR_LINK.nav)}
                >
                  View usage
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
        {!view.hasPaidPlan ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <Link href="#billing-plans" className={OPERATOR_LINK.nav}>
              Choose a plan
            </Link>{" "}
            to activate paid packaging for this workspace.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

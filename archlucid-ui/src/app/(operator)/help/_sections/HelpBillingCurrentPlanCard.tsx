"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { OperatorBillingManageBillingAction } from "@/app/(operator)/administration/settings/billing/OperatorBillingManageBillingAction";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  BILLING_HELP_NO_PERMISSION_HINT,
  BILLING_HELP_PRIMARY_ACTIONS,
} from "@/lib/billing-help-guide-content";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { resolveOperatorBillingCurrentPlan } from "@/lib/operator-billing-current-plan";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator-scope-storage";
import { fetchTenantUsageStatusCached } from "@/lib/tenant-usage-status-client";
import { cn } from "@/lib/utils";

function readWorkspaceLabelFromStorage(): string | null {
  const scope = readOperatorScopeFromStorage();

  if (scope === null) {
    return null;
  }

  const label = scope.workspaceLabel.trim();

  return label.length > 0 ? label : null;
}

function formatSeatSummary(seatsUsed: number | undefined, seatsLimit: number | null | undefined): string | null {
  if (typeof seatsLimit !== "number" || seatsLimit <= 0) {
    return null;
  }

  const used = seatsUsed ?? 0;

  return `${used} of ${seatsLimit} seats in use`;
}

/** Compact plan context and primary billing actions for `/help/billing-and-plans`. */
export function HelpBillingCurrentPlanCard(props: { readonly refreshToken?: number }): React.ReactElement {
  const canMutate = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const { data: trialPayload } = useTenantTrialStatusQuery();
  const [workspaceLabel, setWorkspaceLabel] = useState<string | null>(null);
  const [seatSummary, setSeatSummary] = useState<string | null>(null);

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
        const usage = await fetchTenantUsageStatusCached({
          force: (props.refreshToken ?? 0) > 0,
        });

        if (!cancelled) {
          setSeatSummary(formatSeatSummary(usage?.seatsUsed, usage?.seatsLimit));
        }
      } catch {
        if (!cancelled) {
          setSeatSummary(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.refreshToken]);

  const view = useMemo(
    () =>
      resolveOperatorBillingCurrentPlan({
        isDemoMode: isNextPublicDemoMode(),
        isFrictionlessTrial:
          typeof window !== "undefined" ? readFrictionlessTrialSessionEnabled() : false,
        trialStatus: trialPayload?.status,
        trialDaysRemaining: trialPayload?.daysRemaining,
        workspaceLabel,
        aiBudgetRemainingPercent: null,
      }),
    [trialPayload?.daysRemaining, trialPayload?.status, workspaceLabel],
  );

  const statusLine = view.hasPaidPlan ? "Active subscription" : "No active subscription";

  return (
    <Card
      className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="help-billing-action-panel"
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Your workspace</CardTitle>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{view.supportingLine}</p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
        <dl
          className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
          data-testid="help-billing-current-plan-context"
        >
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Current plan</dt>
            <dd className="font-medium text-al-text-primary">{view.headline}</dd>
          </div>
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Status</dt>
            <dd className="font-medium text-al-text-primary">{statusLine}</dd>
          </div>
          {seatSummary !== null ? (
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Seats</dt>
              <dd className="font-medium text-al-text-primary">{seatSummary}</dd>
            </div>
          ) : null}
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          {canMutate ? (
            <>
              <Button asChild size="sm" variant="primary">
                <Link href={BILLING_HELP_PRIMARY_ACTIONS.manageBilling.href}>
                  {BILLING_HELP_PRIMARY_ACTIONS.manageBilling.label}
                </Link>
              </Button>
              <OperatorBillingManageBillingAction
                canMutate={canMutate}
                variant="outline"
                size="sm"
                testId="help-billing-manage-billing"
              />
            </>
          ) : (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="help-billing-no-permission-hint">
              {BILLING_HELP_NO_PERMISSION_HINT}
            </p>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={BILLING_HELP_PRIMARY_ACTIONS.viewPricing.href}>
              {BILLING_HELP_PRIMARY_ACTIONS.viewPricing.label}
            </Link>
          </Button>
          {!canMutate ? (
            <Button asChild size="sm" variant="outline" title={enterpriseMutationControlDisabledTitle}>
              <Link href={BILLING_HELP_PRIMARY_ACTIONS.manageBilling.href}>Open Billing and plans</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

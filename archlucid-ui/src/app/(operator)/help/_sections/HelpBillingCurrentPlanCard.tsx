"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  BILLING_HELP_NO_PERMISSION_HINT,
  BILLING_HELP_PRIMARY_ACTIONS,
  BILLING_HELP_SUBSCRIPTION_CHECKING_LABEL,
  BILLING_HELP_SUBSCRIPTION_UNAVAILABLE_LABEL,
  BILLING_HELP_VIEW_BILLING_ACTION,
} from "@/lib/billing-help-guide-content";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  resolveOperatorBillingCurrentPlan,
  type OperatorBillingPlanKind,
  type OperatorBillingSubscriptionLoadState,
} from "@/lib/operator/operator-billing-current-plan";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import type { TeamExpansionNudgeStatusPayload } from "@/lib/team-expansion-nudge-trigger";
import { fetchTenantUsageStatusCached } from "@/lib/tenant-usage-status-client";
import { cn } from "@/lib/utils";

export type BillingPlanDataLoadState =
  | { readonly status: "pending" }
  | { readonly status: "unavailable" }
  | { readonly status: "resolved" };

function readWorkspaceLabelFromStorage(): string | null {
  const scope = readOperatorScopeFromStorage();

  if (scope === null) {
    return null;
  }

  const label = scope.workspaceLabel.trim();

  return label.length > 0 ? label : null;
}

type SeatRow = {
  readonly label: string;
  readonly value: string;
};

function resolveSeatRow(
  planKind: OperatorBillingPlanKind,
  hasPaidPlan: boolean,
  seatsUsed: number | undefined,
  seatsLimit: number | null | undefined,
  subscriptionLoadState: OperatorBillingSubscriptionLoadState,
): SeatRow | null {
  if (subscriptionLoadState !== "resolved") {
    return null;
  }

  if (typeof seatsLimit !== "number" || seatsLimit <= 0) {
    return null;
  }

  if (!hasPaidPlan && planKind !== "tenant-trial") {
    return null;
  }

  const used = seatsUsed ?? 0;
  const label = planKind === "tenant-trial" ? "Trial seats" : "Seats";

  return {
    label,
    value: `${used} of ${seatsLimit} in use`,
  };
}

function resolveSubscriptionLoadState(
  trialLoading: boolean,
  trialError: boolean,
  trialPayloadPresent: boolean,
  usageLoaded: boolean,
  usageError: boolean,
  usagePayloadPresent: boolean,
): OperatorBillingSubscriptionLoadState {
  if (trialLoading || !usageLoaded) {
    return "pending";
  }

  if (trialError || usageError) {
    return "unavailable";
  }

  // fetchTenantTrialStatus resolves null on HTTP/network failure without isError —
  // require at least one real signal before claiming a definitive plan answer.
  if (!trialPayloadPresent && !usagePayloadPresent) {
    return "unavailable";
  }

  return "resolved";
}

function resolveSubscriptionStatusDisplay(
  subscriptionLoadState: OperatorBillingSubscriptionLoadState,
  hasPaidPlan: boolean,
): { readonly kind: "neutral" | "ready" | "needs-attention"; readonly label: string } {
  switch (subscriptionLoadState) {
    case "pending":
      return { kind: "neutral", label: BILLING_HELP_SUBSCRIPTION_CHECKING_LABEL };
    case "unavailable":
      return { kind: "neutral", label: BILLING_HELP_SUBSCRIPTION_UNAVAILABLE_LABEL };
    case "resolved":
      if (hasPaidPlan) {
        return { kind: "ready", label: "Active subscription" };
      }

      return { kind: "needs-attention", label: "No active subscription" };
    default: {
      const _exhaustive: never = subscriptionLoadState;
      return _exhaustive;
    }
  }
}

function PublicPricingLink(props: {
  readonly variant: "primary" | "outline";
}): React.ReactElement {
  const { viewPricing } = BILLING_HELP_PRIMARY_ACTIONS;

  if (props.variant === "primary") {
    return (
      <div className="flex flex-col gap-1" data-testid="help-billing-view-public-pricing-wrap">
        <Button asChild size="sm" variant="primary">
          <Link href={viewPricing.href} data-testid="help-billing-view-public-pricing">
            {viewPricing.label}
          </Link>
        </Button>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          ({viewPricing.publicPageHint})
        </p>
      </div>
    );
  }

  return (
    <Button asChild size="sm" variant="outline">
      <Link href={viewPricing.href} data-testid="help-billing-view-public-pricing">
        {viewPricing.label}
        <span className={cn("ml-1 font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
          ({viewPricing.publicPageHint})
        </span>
      </Link>
    </Button>
  );
}

type HelpBillingCurrentPlanCardProps = {
  readonly refreshToken?: number;
  readonly onLoadStateChange?: (state: BillingPlanDataLoadState) => void;
};

/** Compact plan context and primary billing actions for `/help/billing-and-plans`. */
export function HelpBillingCurrentPlanCard(props: HelpBillingCurrentPlanCardProps): React.ReactElement {
  const canMutate = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const {
    data: trialPayload,
    isLoading: trialLoading,
    isError: trialError,
  } = useTenantTrialStatusQuery();
  const [workspaceLabel, setWorkspaceLabel] = useState<string | null>(null);
  const [usagePayload, setUsagePayload] = useState<TeamExpansionNudgeStatusPayload | null>(null);
  const [usageLoaded, setUsageLoaded] = useState(false);
  const [usageError, setUsageError] = useState(false);
  const [seatRow, setSeatRow] = useState<SeatRow | null>(null);

  const subscriptionLoadState = resolveSubscriptionLoadState(
    trialLoading,
    trialError,
    trialPayload != null,
    usageLoaded,
    usageError,
    usagePayload != null,
  );

  useEffect(() => {
    if (subscriptionLoadState === "pending") {
      props.onLoadStateChange?.({ status: "pending" });
      return;
    }

    if (subscriptionLoadState === "unavailable") {
      props.onLoadStateChange?.({ status: "unavailable" });
      return;
    }

    props.onLoadStateChange?.({ status: "resolved" });
  }, [props.onLoadStateChange, subscriptionLoadState]);

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

    setUsageLoaded(false);
    setUsageError(false);

    void (async () => {
      try {
        const usage = await fetchTenantUsageStatusCached({
          force: (props.refreshToken ?? 0) > 0,
        });

        if (cancelled) {
          return;
        }

        // Client returns null on HTTP/network failure and when signed-out skip applies —
        // never treat that as a resolved "no paid plan" answer.
        if (usage === null) {
          setUsagePayload(null);
          setUsageError(true);
          setUsageLoaded(true);
          return;
        }

        setUsagePayload(usage);
        setUsageError(false);
        setUsageLoaded(true);
      } catch {
        if (!cancelled) {
          setUsageError(true);
          setUsageLoaded(true);
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
        isTrialUsage: usagePayload?.isTrial,
        commercialTier: usagePayload?.commercialTier,
        subscriptionLoadState,
      }),
    [
      subscriptionLoadState,
      trialPayload?.daysRemaining,
      trialPayload?.status,
      usagePayload?.commercialTier,
      usagePayload?.isTrial,
      workspaceLabel,
    ],
  );

  useEffect(() => {
    setSeatRow(
      resolveSeatRow(
        view.planKind,
        view.hasPaidPlan,
        usagePayload?.seatsUsed,
        usagePayload?.seatsLimit,
        subscriptionLoadState,
      ),
    );
  }, [
    subscriptionLoadState,
    usagePayload?.seatsLimit,
    usagePayload?.seatsUsed,
    view.hasPaidPlan,
    view.planKind,
  ]);

  const statusDisplay = resolveSubscriptionStatusDisplay(subscriptionLoadState, view.hasPaidPlan);
  const planResolved = subscriptionLoadState === "resolved";

  return (
    <Card
      className="border-neutral-200 dark:border-neutral-800"
      data-testid="help-billing-action-panel"
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle as="h2" className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Your workspace
        </CardTitle>
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
            <dd className="m-0">
              <StatusTag
                kind={statusDisplay.kind}
                label={statusDisplay.label}
                data-testid="help-billing-subscription-status"
              />
            </dd>
          </div>
          {seatRow !== null ? (
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">{seatRow.label}</dt>
              <dd className="font-medium text-al-text-primary">{seatRow.value}</dd>
            </div>
          ) : null}
        </dl>

        {!canMutate ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="help-billing-no-permission-hint">
            {BILLING_HELP_NO_PERMISSION_HINT}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {canMutate ? (
            planResolved ? (
              view.hasPaidPlan ? (
                <>
                  <Button asChild size="sm" variant="primary">
                    <Link href={BILLING_HELP_PRIMARY_ACTIONS.manageBilling.href}>
                      {BILLING_HELP_PRIMARY_ACTIONS.manageBilling.label}
                    </Link>
                  </Button>
                  <PublicPricingLink variant="outline" />
                </>
              ) : (
                <>
                  <PublicPricingLink variant="primary" />
                  <Button asChild size="sm" variant="outline">
                    <Link href={BILLING_HELP_PRIMARY_ACTIONS.manageBilling.href}>
                      {BILLING_HELP_PRIMARY_ACTIONS.manageBilling.label}
                    </Link>
                  </Button>
                </>
              )
            ) : (
              <>
                <PublicPricingLink variant="outline" />
                <Button asChild size="sm" variant="outline">
                  <Link href={BILLING_HELP_PRIMARY_ACTIONS.manageBilling.href}>
                    {BILLING_HELP_PRIMARY_ACTIONS.manageBilling.label}
                  </Link>
                </Button>
              </>
            )
          ) : (
            <>
              <PublicPricingLink variant="outline" />
              <Button asChild size="sm" variant="outline">
                <Link href={BILLING_HELP_VIEW_BILLING_ACTION.href}>
                  {BILLING_HELP_VIEW_BILLING_ACTION.label}
                </Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

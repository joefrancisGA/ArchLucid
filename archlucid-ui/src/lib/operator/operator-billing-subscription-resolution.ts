import type { BillingSubscriptionStatus } from "@/lib/billing-subscription-status-client";
import {
  BILLING_HELP_SUBSCRIPTION_CHECKING_LABEL,
  BILLING_HELP_SUBSCRIPTION_UNAVAILABLE_LABEL,
} from "@/lib/billing-help-guide-content";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { TeamExpansionNudgeStatusPayload } from "@/lib/team-expansion-nudge-trigger";

import type { OperatorBillingSubscriptionLoadState } from "./operator-billing-current-plan";

export type OperatorBillingSubscriptionStatusDisplay = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export function resolveOperatorBillingSubscriptionLoadState(
  subscriptionPending: boolean,
  usagePending: boolean,
  subscriptionFetched: boolean,
  usageFetched: boolean,
  subscriptionData: BillingSubscriptionStatus | null | undefined,
  usageData: TeamExpansionNudgeStatusPayload | null | undefined,
): OperatorBillingSubscriptionLoadState {
  if (subscriptionPending || usagePending) {
    return "pending";
  }

  if (!subscriptionFetched && !usageFetched) {
    return "pending";
  }

  const hasSubscriptionSignal = subscriptionData !== null && subscriptionData !== undefined;
  const hasUsageSignal = usageData !== null && usageData !== undefined;

  if (!usageFetched && !hasSubscriptionSignal) {
    return "pending";
  }

  if (!subscriptionFetched && !hasUsageSignal) {
    return "pending";
  }

  if (!hasSubscriptionSignal && !hasUsageSignal) {
    return "unavailable";
  }

  return "resolved";
}

export function resolveOperatorBillingCommercialTier(
  usageData: TeamExpansionNudgeStatusPayload | null | undefined,
  subscriptionData: BillingSubscriptionStatus | null | undefined,
): string | null {
  const fromUsage = usageData?.commercialTier?.trim() ?? "";

  if (fromUsage.length > 0) {
    return fromUsage;
  }

  const fromSubscription = subscriptionData?.tierCode?.trim() ?? "";

  if (fromSubscription.length > 0) {
    return fromSubscription;
  }

  return null;
}

/**
 * An active subscription is authoritative over the usage payload's trial flag. Trusting a stale
 * `isTrial` here would push the plan card onto the trial path while
 * {@link resolveOperatorBillingHasSubscriptionForInvoice} still reports a live subscription, so the
 * card and the next-invoice notice would state opposite billing facts.
 */
export function resolveOperatorBillingIsTrialUsage(
  usageData: TeamExpansionNudgeStatusPayload | null | undefined,
  subscriptionData: BillingSubscriptionStatus | null | undefined,
): boolean | null | undefined {
  if (subscriptionData?.hasSubscription === true) {
    return false;
  }

  return usageData?.isTrial;
}

export function resolveOperatorBillingSubscriptionStatusDisplay(
  subscriptionLoadState: OperatorBillingSubscriptionLoadState,
  hasPaidPlan: boolean,
): OperatorBillingSubscriptionStatusDisplay {
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

export function resolveOperatorBillingSeatRow(
  hasPaidPlan: boolean,
  isTenantTrial: boolean,
  subscriptionLoadState: OperatorBillingSubscriptionLoadState,
  seatsUsed: number | undefined,
  seatsLimit: number | null | undefined,
): { readonly label: string; readonly value: string } | null {
  if (subscriptionLoadState !== "resolved") {
    return null;
  }

  if (typeof seatsLimit !== "number" || seatsLimit <= 0) {
    return null;
  }

  if (!hasPaidPlan && !isTenantTrial) {
    return null;
  }

  const used = seatsUsed ?? 0;
  const label = isTenantTrial ? "Trial seats" : "Seats";

  return {
    label,
    value: `${used} of ${seatsLimit} in use`,
  };
}

export function resolveOperatorBillingHasSubscriptionForInvoice(
  subscriptionData: BillingSubscriptionStatus | null | undefined,
  hasPaidPlan: boolean,
): boolean {
  if (subscriptionData?.hasSubscription === true) {
    return true;
  }

  if (subscriptionData?.hasSubscription === false) {
    return false;
  }

  return hasPaidPlan;
}

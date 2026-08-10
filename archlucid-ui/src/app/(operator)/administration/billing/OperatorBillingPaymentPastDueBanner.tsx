"use client";

import { cn } from "@/lib/utils";

import { OperatorBillingManageBillingAction } from "@/app/(operator)/administration/billing/OperatorBillingManageBillingAction";
import { useBillingSubscriptionStatusQuery } from "@/hooks/use-billing-subscription-status-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type OperatorBillingPaymentPastDueBannerProps = {
  readonly canMutate: boolean;
};

/** Surfaces Stripe dunning state when subscription payment is past due. */
export function OperatorBillingPaymentPastDueBanner(props: OperatorBillingPaymentPastDueBannerProps) {
  const { data: status } = useBillingSubscriptionStatusQuery();
  const isPastDue = status?.isPaymentPastDue === true;

  if (!isPastDue) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border border-amber-600/40 bg-al-surface-raised px-4 py-3 text-al-text-primary shadow-sm dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="alert"
      data-testid="operator-billing-payment-past-due-banner"
    >
      <p className="m-0 font-semibold text-amber-950 dark:text-amber-100">
        Your subscription payment is past due.
      </p>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
        Update your payment method in Stripe to avoid service interruption. ArchLucid keeps your plan active while
        Stripe retries billing.
      </p>
      {props.canMutate ? (
        <div className="mt-3">
          <OperatorBillingManageBillingAction
            canMutate
            idleLabel="Update payment method"
            variant="primary"
            size="sm"
          />
        </div>
      ) : null}
    </div>
  );
}

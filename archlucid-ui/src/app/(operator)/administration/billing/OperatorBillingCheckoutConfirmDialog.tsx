"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildOperatorBillingSelfServeCheckoutTermsLine,
  type MarketingPricingTierId,
} from "@/lib/marketing/marketing-public-pricing";
import {
  formatIncludedUsersAndWorkspaces,
  formatPlanPrice,
  formatPricingCatalogEffectiveDate,
} from "@/lib/pricing-catalog-display";
import type { PricingDoc, PricingPackage } from "@/lib/pricing-types";
import { cn } from "@/lib/utils";

type OperatorBillingCheckoutConfirmDialogProps = {
  readonly open: boolean;
  readonly tierId: MarketingPricingTierId | null;
  readonly pkg: PricingPackage | null;
  readonly pricing: PricingDoc | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly busy?: boolean;
};

function CheckoutConfirmSummary(props: {
  readonly tierId: MarketingPricingTierId;
  readonly pkg: PricingPackage;
  readonly pricing: PricingDoc;
}): React.JSX.Element {
  const seats = props.pkg.includedUsers ?? 1;
  const workspaces = props.pkg.includedWorkspaces ?? 1;
  const includedLine = formatIncludedUsersAndWorkspaces(props.pkg);
  const termsLine = buildOperatorBillingSelfServeCheckoutTermsLine();

  return (
    <dl className={cn("m-0 space-y-2", OPERATOR_TYPOGRAPHY.body)}>
      <div className="flex justify-between gap-3">
        <dt className="text-neutral-500 dark:text-neutral-400">Plan tier</dt>
        <dd className="font-medium text-al-text-primary">{props.pkg.title}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-neutral-500 dark:text-neutral-400">Price</dt>
        <dd className="font-medium tabular-nums text-al-text-primary">
          {formatPlanPrice(props.pkg, props.pricing.currency)}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-neutral-500 dark:text-neutral-400">Billing period</dt>
        <dd className="font-medium text-al-text-primary">Monthly</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-neutral-500 dark:text-neutral-400">Seats</dt>
        <dd className="font-medium tabular-nums text-al-text-primary">{seats}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-neutral-500 dark:text-neutral-400">Workspaces</dt>
        <dd className="font-medium tabular-nums text-al-text-primary">{workspaces}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-neutral-500 dark:text-neutral-400">Currency</dt>
        <dd className="font-medium text-al-text-primary">{props.pricing.currency}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-neutral-500 dark:text-neutral-400">Effective date</dt>
        <dd className="font-medium text-al-text-primary">
          {formatPricingCatalogEffectiveDate(props.pricing.effectiveDate)}
        </dd>
      </div>
      {includedLine !== null ? (
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500 dark:text-neutral-400">Included</dt>
          <dd className="font-medium text-al-text-primary">{includedLine}</dd>
        </div>
      ) : null}
      <p className={cn("m-0 pt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{termsLine}</p>
    </dl>
  );
}

/** Confirms self-serve checkout details before redirecting to Stripe (operator billing P0). */
export function OperatorBillingCheckoutConfirmDialog(
  props: OperatorBillingCheckoutConfirmDialogProps,
): React.JSX.Element | null {
  if (props.tierId === null || props.pkg === null || props.pricing === null) {
    return null;
  }

  return (
    <ConfirmationDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
      title={`Confirm ${props.pkg.title} checkout`}
      description="Review the purchase summary below. You will be redirected to Stripe only after you confirm."
      confirmLabel="Confirm and continue to checkout"
      cancelLabel="Cancel"
      variant="default"
      busy={props.busy}
      onConfirm={props.onConfirm}
      extraContent={
        <CheckoutConfirmSummary tierId={props.tierId} pkg={props.pkg} pricing={props.pricing} />
      }
    />
  );
}

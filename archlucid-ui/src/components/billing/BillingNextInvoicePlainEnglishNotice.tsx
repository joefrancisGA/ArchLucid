"use client";

import type { ReactElement } from "react";

import { OperatorBillingManageBillingAction } from "@/app/(operator)/administration/billing/OperatorBillingManageBillingAction";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildBillingNextInvoicePlainEnglish,
  type BillingNextInvoicePlainEnglishInput,
} from "@/lib/billing-next-invoice-plain-english";
import { cn } from "@/lib/utils";

export type BillingNextInvoicePlainEnglishNoticeProps = BillingNextInvoicePlainEnglishInput & {
  readonly canMutate: boolean;
  readonly className?: string;
};

/**
 * Next-invoice plain English for operator billing (TB-2223).
 * When amount/date are missing, CTA opens Manage billing (Stripe portal).
 */
export function BillingNextInvoicePlainEnglishNotice(
  props: BillingNextInvoicePlainEnglishNoticeProps,
): ReactElement {
  const { canMutate, className, ...input } = props;
  const view = buildBillingNextInvoicePlainEnglish(input);

  return (
    <aside
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
      data-testid="billing-next-invoice-plain-english"
      aria-label="Next invoice"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        Next invoice
      </p>
      <p
        className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="billing-next-invoice-plain-english-message"
      >
        {view.message}
      </p>
      {view.honestyNote !== null ? (
        <p
          className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="billing-next-invoice-plain-english-honesty"
        >
          {view.honestyNote}
        </p>
      ) : null}
      {view.ctaKind === "manage-billing" && view.ctaLabel !== null ? (
        <div className="mt-3" data-testid="billing-next-invoice-plain-english-cta">
          <OperatorBillingManageBillingAction
            canMutate={canMutate}
            idleLabel={view.ctaLabel}
            variant="outline"
            size="sm"
            testId="billing-next-invoice-manage-billing"
          />
        </div>
      ) : null}
    </aside>
  );
}

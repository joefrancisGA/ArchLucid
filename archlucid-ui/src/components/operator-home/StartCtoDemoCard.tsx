"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { CtoDemoCustomerStartError } from "@/components/cto-demo/CtoDemoCustomerStartError";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { EXPLORE_ARCHLUCID_ROW_CLASS } from "@/components/operator-home/explore-archlucid-row-class";
import {
  BUYER_HOME_START_CTO_DEMO_ARIA,
  BUYER_HOME_START_CTO_DEMO_CTA,
  BUYER_HOME_START_CTO_DEMO_HEADING,
  BUYER_HOME_START_CTO_DEMO_LEAD,
} from "@/lib/buyer/buyer-polish-copy";
import { buyerCtoDemoCustomerStartHref } from "@/lib/buyer/buyer-cto-demo-customer-start";
import { useBuyerCtoDemoCustomerStart } from "@/hooks/use-buyer-cto-demo-customer-start";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Buyer-facing example review row inside Explore ArchLucid. */
export function StartCtoDemoCard(): React.JSX.Element {
  const router = useRouter();
  const customerStart = useBuyerCtoDemoCustomerStart();

  const handleStart = useCallback(async () => {
    const outcome = await customerStart.startDemo();

    if (outcome === null || outcome.status === "failed") {
      return;
    }

    router.push(buyerCtoDemoCustomerStartHref());
  }, [customerStart, router]);

  return (
    <section
      aria-label={BUYER_HOME_START_CTO_DEMO_ARIA}
      data-testid="start-cto-demo-card"
      className={EXPLORE_ARCHLUCID_ROW_CLASS}
    >
      <h3 id="start-cto-demo-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {BUYER_HOME_START_CTO_DEMO_HEADING}
      </h3>
      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {BUYER_HOME_START_CTO_DEMO_LEAD}
      </p>
      {customerStart.sampleModeNotice !== null ? (
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {customerStart.sampleModeNotice}
        </p>
      ) : null}
      <div className="mt-3 space-y-3">
        <ReviewStartLoadingButton
          type="button"
          variant="primary"
          className="w-full justify-center sm:w-auto"
          idleLabel={BUYER_HOME_START_CTO_DEMO_CTA}
          loadingLabel={customerStart.loadingLabel}
          isLoading={customerStart.isStarting}
          onClick={() => {
            void handleStart();
          }}
          data-testid="start-cto-demo-cta"
        />
        {customerStart.errorMessage !== null ? (
          <CtoDemoCustomerStartError
            message={customerStart.errorMessage}
            tryingAgain={customerStart.isStarting}
            onTryAgain={() => {
              void handleStart();
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

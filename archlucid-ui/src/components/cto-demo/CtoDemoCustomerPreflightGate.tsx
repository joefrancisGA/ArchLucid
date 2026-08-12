"use client";

import { useCallback, useEffect } from "react";

import { CtoDemoCustomerStartError } from "@/components/cto-demo/CtoDemoCustomerStartError";
import { ReviewStartInlineSpinner } from "@/components/review-intake/ReviewStartInlineSpinner";
import { useBuyerCtoDemoCustomerStart } from "@/hooks/use-buyer-cto-demo-customer-start";
import { BUYER_CTO_DEMO_PREFLIGHT_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CtoDemoCustomerPreflightGateProps = {
  readonly onAcknowledged: () => void;
};

/** Brief invisible preflight before the tour overlay — no internal readiness rows. */
export function CtoDemoCustomerPreflightGate(props: CtoDemoCustomerPreflightGateProps): React.JSX.Element {
  const { onAcknowledged } = props;
  const customerStart = useBuyerCtoDemoCustomerStart();

  const runPreflight = useCallback(async () => {
    const outcome = await customerStart.startDemo();

    if (outcome !== null && outcome.status !== "failed") {
      onAcknowledged();
    }
  }, [customerStart, onAcknowledged]);

  useEffect(() => {
    void runPreflight();
  }, [runPreflight]);

  if (customerStart.errorMessage !== null) {
    return (
      <CtoDemoCustomerStartError
        message={customerStart.errorMessage}
        tryingAgain={customerStart.isStarting}
        onTryAgain={() => {
          void runPreflight();
        }}
      />
    );
  }

  return (
    <div className="space-y-2" data-testid="cto-demo-customer-preflight-gate" aria-live="polite" aria-busy={customerStart.isStarting}>
      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{BUYER_CTO_DEMO_PREFLIGHT_HEADING}</h3>
      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
        <ReviewStartInlineSpinner />
        <span>{customerStart.loadingLabel}</span>
      </div>
      {customerStart.sampleModeNotice !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body, "text-neutral-600 dark:text-neutral-400")}>
          {customerStart.sampleModeNotice}
        </p>
      ) : null}
    </div>
  );
}

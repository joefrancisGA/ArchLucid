"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { BUYER_CTO_DEMO_VALUE_STRIP_LABELS } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CtoDemoBuyerValueStripProps = {
  readonly stepIndex: 0 | 1 | 2 | 3 | 4;
};

/** Buyer-facing one-line value statement for each CTO demo step. */
export function CtoDemoBuyerValueStrip(props: CtoDemoBuyerValueStripProps): React.JSX.Element | null {
  const { stepIndex } = props;
  const [visible, setVisible] = useState(false);
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    const shouldShow = readBuyerCtoDemoTourActive() && isBuyerPolishedOperatorShellEnv();

    setVisible(shouldShow);

    if (shouldShow) {
      // Defer the opacity reveal one frame so the transition fires.
      requestAnimationFrame(() => { setFaded(true); });
    }
  }, []);

  if (!visible) {
    return null;
  }

  const valueLine = BUYER_CTO_DEMO_VALUE_STRIP_LABELS[stepIndex];

  return (
    <div
      className={cn(
        "mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 print:hidden dark:border-neutral-700 dark:bg-neutral-900/50",
        "transition-opacity duration-150",
        faded ? "opacity-100" : "opacity-0",
      )}
      data-testid={`cto-demo-buyer-value-strip-${stepIndex}`}
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.badge, "text-neutral-500 dark:text-neutral-400")}>
        What you&apos;re seeing
      </p>
      <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{valueLine}</p>
    </div>
  );
}

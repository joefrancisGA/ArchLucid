"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import {
  BUYER_CTO_DEMO_SEGREGATION_CALLOUT_BODY,
  BUYER_CTO_DEMO_SEGREGATION_CALLOUT_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Highlights segregation of duties during the CTO demo governance step. */
export function CtoDemoSegregationCallout(): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVisible(readBuyerCtoDemoTourActive() && isBuyerPolishedOperatorShellEnv());
  }, []);

  if (!mounted || !visible) {
    return null;
  }

  return (
    <div
      role="note"
      data-testid="cto-demo-segregation-callout"
      className={cn("mb-4 rounded-md border border-teal-200/70 bg-teal-50/80 px-4 py-3 text-teal-950 print:hidden", OPERATOR_TYPOGRAPHY.body,
        "dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100",
      )}
    >
      <p className={cn("m-0 font-semibold", OPERATOR_TYPE_SCALE.cardTitle)}>{BUYER_CTO_DEMO_SEGREGATION_CALLOUT_HEADING}</p>
      <p className="m-0 mt-1">{BUYER_CTO_DEMO_SEGREGATION_CALLOUT_BODY}</p>
    </div>
  );
}

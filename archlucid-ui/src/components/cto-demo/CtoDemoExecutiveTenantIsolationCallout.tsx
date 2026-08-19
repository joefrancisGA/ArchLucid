"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { CtoDemoHowItWorksTrigger } from "@/components/cto-demo/CtoDemoHowItWorksTrigger";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SHOWCASE_DEMO_TENANT_NAME } from "@/lib/showcase-static-demo";

/** Step 1 trust note — makes tenant isolation tangible at the sponsor landing moment. */
export function CtoDemoSponsorTenantIsolationCallout(): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVisible(
      isBuyerPolishedOperatorShellEnv() && (isCtoDemoPackEnv() || readBuyerCtoDemoTourActive()),
    );
  }, []);

  if (!mounted || !visible) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}
      data-testid="cto-demo-sponsor-isolation-callout"
    >
      Showing data from the <span className="font-semibold text-neutral-800 dark:text-neutral-200">{SHOWCASE_DEMO_TENANT_NAME}</span>{" "}
      tenant — isolated from all other tenants by design.{" "}
      <CtoDemoHowItWorksTrigger variant="link" />
    </p>
  );
}

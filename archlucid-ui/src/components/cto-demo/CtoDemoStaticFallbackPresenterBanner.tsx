"use client";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useState } from "react";

import { BUYER_CTO_DEMO_STATIC_PRESENTER_BANNER } from "@/lib/buyer/buyer-polish-copy";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

/** Presenter-only notice when cached showcase data is in use (#13). */
export function CtoDemoStaticFallbackPresenterBanner(): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTourActive(readBuyerCtoDemoTourActive());
  }, []);

  if (!mounted || !isBuyerPolishedOperatorShellEnv() || !tourActive || !isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  return (
    <div
      role="status"
      data-testid="cto-demo-static-fallback-presenter-banner"
      className={cn("mb-3", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}
    >
      {BUYER_CTO_DEMO_STATIC_PRESENTER_BANNER}
    </div>
  );
}

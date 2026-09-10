"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { CompositeAlertRulesClaimOrientationStrip } from "./CompositeAlertRulesClaimOrientationStrip";

/** Buyer default: mount Sources orientation after primary Advanced rules workspace (GOA). */
export function CompositeAlertRulesBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="composite-alert-rules-orientation-bottom">
      <CompositeAlertRulesClaimOrientationStrip />
    </div>
  );
}

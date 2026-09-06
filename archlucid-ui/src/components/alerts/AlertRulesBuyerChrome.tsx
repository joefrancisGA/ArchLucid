"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { AlertRulesConditionsClaimOrientationStrip } from "./AlertRulesConditionsClaimOrientationStrip";

/** Buyer default: mount Sources orientation after primary Conditions workspace (GLR). */
export function AlertRulesBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="alert-rules-conditions-orientation-bottom">
      <AlertRulesConditionsClaimOrientationStrip />
    </div>
  );
}

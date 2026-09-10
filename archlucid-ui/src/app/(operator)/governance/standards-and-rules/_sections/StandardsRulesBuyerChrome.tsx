"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { StandardsRulesClaimOrientationStrip } from "./StandardsRulesClaimOrientationStrip";

/** Buyer default: mount Sources after primary workspace standards-and-rules table (GRS). */
export function StandardsRulesBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 text-left" data-testid="standards-rules-orientation-bottom">
      <StandardsRulesClaimOrientationStrip />
    </div>
  );
}

"use client";

import { ItsmOAuthCallbackEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Buyer default: mount follow-up Sources above the consent outcome card (IIO). */
export function ItsmAtlassianOAuthCallbackBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="itsm-oauth-callback-orientation-top">
      <ItsmOAuthCallbackEvidenceOrientationStrip />
    </div>
  );
}

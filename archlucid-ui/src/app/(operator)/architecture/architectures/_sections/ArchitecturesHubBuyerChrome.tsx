"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

import { ArchitecturesHubClaimOrientationStrip } from "./ArchitecturesHubClaimOrientationStrip";

/** Guided eval chrome: mount Sources orientation above the draft inventory workspace (ARA). */
export function ArchitecturesHubBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (!evalChromeShell && !buyerPolishedShell) {
    return null;
  }

  return (
    <div data-testid="architectures-hub-orientation-top">
      <ArchitecturesHubClaimOrientationStrip />
    </div>
  );
}

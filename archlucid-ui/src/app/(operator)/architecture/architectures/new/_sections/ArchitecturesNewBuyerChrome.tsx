"use client";

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ArchitecturesNewClaimOrientationStrip } from "./ArchitecturesNewClaimOrientationStrip";

/** Guided eval chrome: mount Sources orientation above create-bootstrap workspace (ANE). */
export function ArchitecturesNewBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (!evalChromeShell && !buyerPolishedShell) {
    return null;
  }

  return (
    <div className="text-left" data-testid="architectures-new-orientation-top">
      <ArchitecturesNewClaimOrientationStrip />
    </div>
  );
}

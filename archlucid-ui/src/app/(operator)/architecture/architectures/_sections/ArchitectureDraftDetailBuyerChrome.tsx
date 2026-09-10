"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

import { ArchitectureDraftDetailClaimOrientationStrip } from "./ArchitectureDraftDetailClaimOrientationStrip";

/** Guided eval chrome: mount Sources orientation above the draft workspace body (ARR). */
export function ArchitectureDraftDetailBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (!evalChromeShell && !buyerPolishedShell) {
    return null;
  }

  return (
    <div data-testid="architecture-draft-detail-orientation-top">
      <ArchitectureDraftDetailClaimOrientationStrip />
    </div>
  );
}

"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

import { ArchitectureIntelligenceClaimOrientationStrip } from "./ArchitectureIntelligenceClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function ArchitectureIntelligenceBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (!evalChromeShell && !buyerPolishedShell) {
    return null;
  }

  return (
    <div data-testid="architecture-intelligence-orientation-top">
      <ArchitectureIntelligenceClaimOrientationStrip />
    </div>
  );
}

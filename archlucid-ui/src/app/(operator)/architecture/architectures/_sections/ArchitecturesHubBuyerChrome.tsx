"use client";

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

import { ArchitecturesHubClaimOrientationStrip } from "./ArchitecturesHubClaimOrientationStrip";

/** Guided eval chrome: mount claim discipline + Sources after primary workspace draft list (CA-47). */
export function ArchitecturesHubBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return <ArchitecturesHubClaimOrientationStrip />;
}

"use client";

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

import { ArchitectureIntelligenceClaimOrientationStrip } from "./ArchitectureIntelligenceClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function ArchitectureIntelligenceBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return <ArchitectureIntelligenceClaimOrientationStrip />;
}

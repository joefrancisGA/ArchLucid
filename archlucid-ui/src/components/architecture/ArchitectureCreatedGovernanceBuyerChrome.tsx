"use client";

import { ArchitectureCreatedGovernanceSourcesOrientationStrip } from "@/components/architecture/ArchitectureCreatedGovernanceSourcesOrientationStrip";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

/** Buyer default: mount Sources orientation after primary Governance workspace (REG). */
export function ArchitectureCreatedGovernanceBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return <ArchitectureCreatedGovernanceSourcesOrientationStrip />;
}

"use client";

import { ArchitectureCreatedFindingsSourcesOrientationStrip } from "@/components/architecture/ArchitectureCreatedFindingsSourcesOrientationStrip";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

/** Buyer default: mount Sources orientation after primary Findings workspace (REF). */
export function ArchitectureCreatedFindingsBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return <ArchitectureCreatedFindingsSourcesOrientationStrip />;
}

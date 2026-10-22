"use client";

import { ArchitectureCreatedEvidenceSourcesOrientationStrip } from "@/components/architecture/ArchitectureCreatedEvidenceSourcesOrientationStrip";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

/** Buyer default: mount Sources orientation after primary Evidence workspace (REE). */
export function ArchitectureCreatedEvidenceBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return <ArchitectureCreatedEvidenceSourcesOrientationStrip />;
}

"use client";

import { ArchitectureCreatedEvidenceClaimOrientationStrip } from "@/components/architecture/ArchitectureCreatedEvidenceClaimOrientationStrip";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Evidence workspace (REE). */
export function ArchitectureCreatedEvidenceBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return (
    <div data-testid="architecture-evidence-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <ArchitectureCreatedEvidenceClaimOrientationStrip />
    </div>
  );
}

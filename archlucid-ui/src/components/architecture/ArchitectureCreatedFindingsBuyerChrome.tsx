"use client";

import { ArchitectureCreatedFindingsClaimOrientationStrip } from "@/components/architecture/ArchitectureCreatedFindingsClaimOrientationStrip";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Findings workspace (REF). */
export function ArchitectureCreatedFindingsBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return (
    <div data-testid="architecture-findings-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <ArchitectureCreatedFindingsClaimOrientationStrip />
    </div>
  );
}

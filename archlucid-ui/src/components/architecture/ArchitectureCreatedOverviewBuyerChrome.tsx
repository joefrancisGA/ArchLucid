"use client";

import { ArchitectureCreatedOverviewEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedOverviewEvidenceOrientationStrip";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Overview workspace (REO). */
export function ArchitectureCreatedOverviewBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return (
    <div data-testid="architecture-overview-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <ArchitectureCreatedOverviewEvidenceOrientationStrip />
    </div>
  );
}

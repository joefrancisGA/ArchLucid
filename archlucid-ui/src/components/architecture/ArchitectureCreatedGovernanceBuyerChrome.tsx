"use client";

import { ArchitectureCreatedGovernanceClaimOrientationStrip } from "@/components/architecture/ArchitectureCreatedGovernanceClaimOrientationStrip";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Governance workspace (REG). */
export function ArchitectureCreatedGovernanceBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return (
    <div data-testid="architecture-governance-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <ArchitectureCreatedGovernanceClaimOrientationStrip />
    </div>
  );
}

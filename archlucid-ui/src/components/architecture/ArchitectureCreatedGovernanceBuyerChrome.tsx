"use client";

import { ArchitectureCreatedGovernanceEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedGovernanceEvidenceOrientationStrip";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Governance workspace (REG). */
export function ArchitectureCreatedGovernanceBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="architecture-governance-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <ArchitectureCreatedGovernanceEvidenceOrientationStrip />
    </div>
  );
}

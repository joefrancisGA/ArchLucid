"use client";

import { ArchitectureCreatedFindingsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedFindingsEvidenceOrientationStrip";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Findings workspace (REF). */
export function ArchitectureCreatedFindingsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="architecture-findings-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <ArchitectureCreatedFindingsEvidenceOrientationStrip />
    </div>
  );
}

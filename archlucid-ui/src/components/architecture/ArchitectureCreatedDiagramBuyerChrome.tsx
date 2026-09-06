"use client";

import { ArchitectureCreatedDiagramEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedDiagramEvidenceOrientationStrip";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Diagram workspace (RED). */
export function ArchitectureCreatedDiagramBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="architecture-diagram-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <ArchitectureCreatedDiagramEvidenceOrientationStrip />
    </div>
  );
}

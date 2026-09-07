"use client";

import { ArchitectureCreatedEvidenceEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedEvidenceEvidenceOrientationStrip";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Evidence workspace (REE). */
export function ArchitectureCreatedEvidenceBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="architecture-evidence-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <ArchitectureCreatedEvidenceEvidenceOrientationStrip />
    </div>
  );
}

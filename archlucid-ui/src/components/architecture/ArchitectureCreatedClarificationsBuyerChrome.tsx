"use client";

import { ArchitectureCreatedClarificationsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedClarificationsEvidenceOrientationStrip";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Clarifications workspace (REC). */
export function ArchitectureCreatedClarificationsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="architecture-clarifications-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <ArchitectureCreatedClarificationsEvidenceOrientationStrip />
    </div>
  );
}

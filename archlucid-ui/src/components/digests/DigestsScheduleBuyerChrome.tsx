"use client";

import { DigestsScheduleEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DIGESTS_SCHEDULE_ORIENTATION_SOURCES } from "@/lib/digests-schedule-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation above primary sponsor schedule workspace (ARS). */
export function DigestsScheduleBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (!evalChromeShell && !buyerPolishedShell) {
    return null;
  }

  return (
    <div data-testid="digests-schedule-orientation-top">
      <DigestsScheduleEvidenceOrientationStrip
        readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
        sources={DIGESTS_SCHEDULE_ORIENTATION_SOURCES}
      />
    </div>
  );
}

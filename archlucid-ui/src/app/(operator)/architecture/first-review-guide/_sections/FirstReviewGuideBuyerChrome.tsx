"use client";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  FIRST_REVIEW_GUIDE_SOURCES,
  FIRST_REVIEW_GUIDE_SOURCES_INTRO,
} from "@/lib/first-review-guide-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Guided buyer/eval chrome: mount Sources orientation above first-review checklist (ARF). */
export function FirstReviewGuideBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (!evalChromeShell && !buyerPolishedShell) {
    return null;
  }

  return (
    <div data-testid="first-review-guide-orientation-top">
      <EvidenceOrientationClaimAndSourcesStrip
        slug="first-review-guide"
        sourcesIntro={FIRST_REVIEW_GUIDE_SOURCES_INTRO}
        sources={FIRST_REVIEW_GUIDE_SOURCES}
        sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorMuted}
        readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      />
    </div>
  );
}

"use client";

import { DigestsBrowseEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DIGESTS_BROWSE_ORIENTATION_SOURCES } from "@/lib/digests-browse-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Get started browse workspace (ARB). */
export function DigestsBrowseBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="digests-browse-orientation-top">
      <DigestsBrowseEvidenceOrientationStrip
        readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
        sources={DIGESTS_BROWSE_ORIENTATION_SOURCES}
      />
    </div>
  );
}

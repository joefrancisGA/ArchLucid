"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { DigestsBrowseEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolveDigestsBrowseOrientationSources } from "@/lib/digests-browse-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation above primary Get started browse workspace (ARD). */
export function DigestsBrowseBuyerChrome(): React.JSX.Element | null {
  const { productLine } = useProductLine();

  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="digests-browse-orientation-top">
      <DigestsBrowseEvidenceOrientationStrip
        readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
        sources={resolveDigestsBrowseOrientationSources(productLine)}
      />
    </div>
  );
}

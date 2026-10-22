"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  HELP_HUB_FOLLOW_UPS_TITLE,
  resolveHelpHubOrientationSources,
  resolveHelpHubOrientationSourcesIntro,
} from "@/lib/help/help-hub-evidence-copy";

/** Sources index for Help Center hub (HEL) — claim discipline lives in page header. */
export function HelpHubClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-hub"
      sourcesTitle={HELP_HUB_FOLLOW_UPS_TITLE}
      sourcesIntro={resolveHelpHubOrientationSourcesIntro(productLine)}
      sources={resolveHelpHubOrientationSources(productLine)}
      hubSecondary
    />
  );
}

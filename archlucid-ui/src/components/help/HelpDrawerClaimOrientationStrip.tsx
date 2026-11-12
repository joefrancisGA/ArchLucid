"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  CONTEXTUAL_HELP_DRAWER_SOURCES_INTRO,
  resolveContextualHelpDrawerSources,
} from "@/lib/contextual-help-drawer-evidence-copy";

/** Claim discipline + Sources index for the contextual help drawer (HCD). */
export function HelpDrawerClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="contextual-help-drawer"
      sourcesIntro={CONTEXTUAL_HELP_DRAWER_SOURCES_INTRO}
      sources={resolveContextualHelpDrawerSources(productLine)}
    />
  );
}

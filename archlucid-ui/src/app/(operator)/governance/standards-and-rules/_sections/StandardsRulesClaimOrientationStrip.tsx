"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  STANDARDS_RULES_FOLLOW_UPS_TITLE,
  STANDARDS_RULES_ORIENTATION_SOURCES_INTRO,
  resolveStandardsRulesOrientationSources,
} from "@/lib/standards-rules-evidence-copy";

/** Claim discipline + Sources index for the standards-and-rules hub (GRS). */
export function StandardsRulesClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="standards-rules-hub"
      sourcesTitle={STANDARDS_RULES_FOLLOW_UPS_TITLE}
      sourcesIntro={STANDARDS_RULES_ORIENTATION_SOURCES_INTRO}
      sources={resolveStandardsRulesOrientationSources(productLine)}
      hubSecondary
    />
  );
}

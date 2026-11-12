"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PLANNING_SOURCES_INTRO,
  resolvePlanningSources,
} from "@/lib/planning-evidence-copy";

/** Claim discipline + Sources index for improvement planning (PLA). */
export function PlanningClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="improvement-planning"
      sourcesIntro={PLANNING_SOURCES_INTRO}
      sources={resolvePlanningSources(productLine)}
    />
  );
}

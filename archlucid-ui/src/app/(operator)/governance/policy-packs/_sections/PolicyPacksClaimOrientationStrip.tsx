"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  POLICY_PACKS_HUB_FOLLOW_UPS_TITLE,
  POLICY_PACKS_HUB_SOURCES_INTRO,
  resolvePolicyPacksHubOrientationSources,
} from "@/lib/policy/policy-packs-hub-evidence-copy";



/** Claim discipline + Sources index for the policy packs hub (GPP). */
export function PolicyPacksClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="policy-packs-hub"
      sourcesTitle={POLICY_PACKS_HUB_FOLLOW_UPS_TITLE}
      sourcesIntro={POLICY_PACKS_HUB_SOURCES_INTRO}
      sources={resolvePolicyPacksHubOrientationSources(productLine)}
      hubSecondary
    />
  );
}

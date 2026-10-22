"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  POLICY_PACK_DETAIL_FOLLOW_UPS_TITLE,
  POLICY_PACK_DETAIL_SOURCES_INTRO,
  policyPackDetailSourcesForProductLine,
} from "@/lib/policy/policy-pack-detail-evidence-copy";

/** Claim discipline + Sources index for policy pack detail (GPI). */
export function PolicyPackDetailClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();
  const sources = policyPackDetailSourcesForProductLine(productLine);

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="policy-pack-detail"
      sourcesTitle={POLICY_PACK_DETAIL_FOLLOW_UPS_TITLE}
      sourcesIntro={POLICY_PACK_DETAIL_SOURCES_INTRO}
      sources={sources}
      hubSecondary
    />
  );
}

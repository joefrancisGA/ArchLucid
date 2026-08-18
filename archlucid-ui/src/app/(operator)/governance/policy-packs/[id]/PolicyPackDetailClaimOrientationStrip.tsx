import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  POLICY_PACK_DETAIL_CLAIM_DISCIPLINE,
  POLICY_PACK_DETAIL_SOURCES,
  POLICY_PACK_DETAIL_SOURCES_INTRO,
} from "@/lib/policy/policy-pack-detail-evidence-copy";
import { POLICY_PACK_DETAIL_CLAIM_HEADING } from "@/lib/policy/policy-pack-detail-page-copy";

/** Claim discipline + Sources index for policy pack detail (GPI). */
export function PolicyPackDetailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="policy-pack-detail"
      claim={POLICY_PACK_DETAIL_CLAIM_DISCIPLINE}
      claimHeading={POLICY_PACK_DETAIL_CLAIM_HEADING}
      sourcesIntro={POLICY_PACK_DETAIL_SOURCES_INTRO}
      sources={POLICY_PACK_DETAIL_SOURCES}
    />
  );
}

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  POLICY_PACKS_HUB_CLAIM_DISCIPLINE,
  POLICY_PACKS_HUB_FOLLOW_UPS_TITLE,
  POLICY_PACKS_HUB_SOURCES,
  POLICY_PACKS_HUB_SOURCES_INTRO,
} from "@/lib/policy/policy-packs-hub-evidence-copy";

import { POLICY_PACKS_CLAIM_HEADING } from "./policy-packs-page-copy";

/** Claim discipline + Sources index for the policy packs hub (GPP). */
export function PolicyPacksClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="policy-packs-hub"
      claim={POLICY_PACKS_HUB_CLAIM_DISCIPLINE}
      claimHeading={POLICY_PACKS_CLAIM_HEADING}
      sourcesTitle={POLICY_PACKS_HUB_FOLLOW_UPS_TITLE}
      sourcesIntro={POLICY_PACKS_HUB_SOURCES_INTRO}
      sources={POLICY_PACKS_HUB_SOURCES}
      hubSecondary
    />
  );
}

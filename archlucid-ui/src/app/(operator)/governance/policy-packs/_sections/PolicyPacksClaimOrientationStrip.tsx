import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  POLICY_PACKS_HUB_FOLLOW_UPS_TITLE,
  POLICY_PACKS_HUB_SOURCES,
  POLICY_PACKS_HUB_SOURCES_INTRO,
} from "@/lib/policy/policy-packs-hub-evidence-copy";



/** Claim discipline + Sources index for the policy packs hub (GPP). */
export function PolicyPacksClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="policy-packs-hub"
      sourcesTitle={POLICY_PACKS_HUB_FOLLOW_UPS_TITLE}
      sourcesIntro={POLICY_PACKS_HUB_SOURCES_INTRO}
      sources={POLICY_PACKS_HUB_SOURCES}
      hubSecondary
    />
  );
}

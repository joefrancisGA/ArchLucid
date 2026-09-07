import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_ASK_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";

/** Claim discipline + Sources index for infrastructure Ask (GOS). */
export function InfrastructureAskClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-infrastructure-ask"
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_ASK_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_ASK_SOURCES}
    />
  );
}

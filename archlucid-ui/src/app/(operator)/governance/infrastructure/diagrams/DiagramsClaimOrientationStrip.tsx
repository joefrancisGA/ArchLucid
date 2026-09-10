import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";

/** Claim discipline + Sources index for inventory diagrams (OIN). */
export function DiagramsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-infrastructure-diagrams"
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SOURCES}
    />
  );
}

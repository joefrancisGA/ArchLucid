import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";

/** Claim discipline + Sources index for drift workbench (GOR). */
export function DriftClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-infrastructure-drift"
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_DRIFT_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_DRIFT_SOURCES}
    />
  );
}

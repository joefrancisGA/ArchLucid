import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURE_CREATED_GOVERNANCE_FOLLOW_UPS_TITLE,
  ARCHITECTURE_CREATED_GOVERNANCE_SOURCES,
  ARCHITECTURE_CREATED_GOVERNANCE_SOURCES_INTRO,
} from "@/lib/architecture/architecture-created-governance-sources";

/** Sources follow-ups for create-home Governance tab (REG). */
export function ArchitectureCreatedGovernanceClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-governance"
      sourcesTestId="architecture-governance-sources"
      sourcesTitle={ARCHITECTURE_CREATED_GOVERNANCE_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_CREATED_GOVERNANCE_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_GOVERNANCE_SOURCES}
      hubSecondary
    />
  );
}

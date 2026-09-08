import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURE_CREATED_FINDINGS_FOLLOW_UPS_TITLE,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO,
} from "@/lib/architecture/architecture-created-findings-sources";

/** Sources follow-ups for create-home Findings tab (REF). */
export function ArchitectureCreatedFindingsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-findings"
      sourcesTestId="architecture-findings-sources"
      sourcesTitle={ARCHITECTURE_CREATED_FINDINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_FINDINGS_SOURCES}
      hubSecondary
    />
  );
}

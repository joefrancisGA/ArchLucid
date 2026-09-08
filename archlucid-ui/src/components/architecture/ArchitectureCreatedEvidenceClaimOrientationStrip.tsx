import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURE_CREATED_EVIDENCE_FOLLOW_UPS_TITLE,
  ARCHITECTURE_CREATED_EVIDENCE_SOURCES,
  ARCHITECTURE_CREATED_EVIDENCE_SOURCES_INTRO,
} from "@/lib/architecture/architecture-created-evidence-sources";

/** Sources follow-ups for create-home Evidence tab (REE). */
export function ArchitectureCreatedEvidenceClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-evidence"
      sourcesTestId="architecture-evidence-sources"
      sourcesTitle={ARCHITECTURE_CREATED_EVIDENCE_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_CREATED_EVIDENCE_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_EVIDENCE_SOURCES}
      hubSecondary
    />
  );
}

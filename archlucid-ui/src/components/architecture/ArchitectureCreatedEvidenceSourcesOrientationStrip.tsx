import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURE_CREATED_EVIDENCE_FOLLOW_UPS_TITLE,
  ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_BOTTOM_TEST_ID,
  ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_SOURCES_INTRO,
  ARCHITECTURE_CREATED_EVIDENCE_SOURCES,
} from "@/lib/architecture/architecture-created-evidence-sources";

/** Sources-only follow-ups for create-home Evidence tab buyer-polished shell (REE). */
export function ArchitectureCreatedEvidenceSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-evidence"
      stripTestId={ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="architecture-evidence-sources"
      sourcesTitle={ARCHITECTURE_CREATED_EVIDENCE_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_EVIDENCE_SOURCES}
      hubSecondary
    />
  );
}

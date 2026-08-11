import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  ARCHITECTURE_CREATED_CLARIFICATIONS_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES,
  ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES_INTRO,
} from "@/lib/architecture-created-clarifications-sources";

/** Sources and claim discipline for create-home Clarifications tab (REC). */
export function ArchitectureCreatedClarificationsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="architecture-clarifications"
      align="text-left"
      sourcesIntro={ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES}
      claimHeading="Pre-finalize gaps only"
      claim={ARCHITECTURE_CREATED_CLARIFICATIONS_CLAIM_DISCIPLINE}
    />
  );
}

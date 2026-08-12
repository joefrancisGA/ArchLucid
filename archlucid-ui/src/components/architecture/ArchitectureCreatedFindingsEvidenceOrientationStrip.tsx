import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  ARCHITECTURE_CREATED_FINDINGS_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO,
} from "@/lib/architecture/architecture-created-findings-sources";

/** Sources and claim discipline for create-home Findings tab (REF). */
export function ArchitectureCreatedFindingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="architecture-findings"
      align="text-left"
      sourcesIntro={ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_FINDINGS_SOURCES}
      claimHeading="Pre-finalize findings only"
      claim={ARCHITECTURE_CREATED_FINDINGS_CLAIM_DISCIPLINE}
    />
  );
}

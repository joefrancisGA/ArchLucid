import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE,
  COMPLIANCE_JOURNEY_SOURCES,
  COMPLIANCE_JOURNEY_SOURCES_INTRO,
} from "@/lib/compliance-journey-evidence-copy";

/** Evaluation Sources + claim discipline for `/compliance-journey` (COM Evidence). */
export function ComplianceJourneyEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="compliance-journey"
      margin="mt-6"
      align="text-left"
      sourcesIntro={COMPLIANCE_JOURNEY_SOURCES_INTRO}
      sources={COMPLIANCE_JOURNEY_SOURCES}
      claimHeading="Posture summary only"
      claim={COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE}
    />
  );
}

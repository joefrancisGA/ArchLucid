import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE,
  COMPLIANCE_JOURNEY_SOURCES,
  COMPLIANCE_JOURNEY_SOURCES_INTRO,
} from "@/lib/compliance-journey-evidence-copy";

/** Claim discipline + Sources index for compliance journey (COM). */
export function ComplianceJourneyClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="compliance-journey"
      sourcesTitle={COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE}
      sourcesIntro={COMPLIANCE_JOURNEY_SOURCES_INTRO}
      sources={COMPLIANCE_JOURNEY_SOURCES}
    />
  );
}

import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  EVIDENCE_CLAIM_STYLE,
  EVIDENCE_SOURCES_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ARCHITECTURE_CREATED_OVERVIEW_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_OVERVIEW_SOURCES,
  ARCHITECTURE_CREATED_OVERVIEW_SOURCES_INTRO,
} from "@/lib/architecture-created-overview-sources";

/** Sources and claim discipline for create-home Overview tab (REO). */
export function ArchitectureCreatedOverviewEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="architecture-overview"
      align="text-left"
      sourcesIntro={ARCHITECTURE_CREATED_OVERVIEW_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_OVERVIEW_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationInfoCallout}
      claimHeading="Pre-finalize orientation only"
      claim={ARCHITECTURE_CREATED_OVERVIEW_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
    />
  );
}

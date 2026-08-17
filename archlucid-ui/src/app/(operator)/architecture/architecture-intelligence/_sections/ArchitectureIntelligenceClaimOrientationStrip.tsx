import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { ARCHITECTURE_INTELLIGENCE_CLAIM_HEADING } from "@/lib/architecture/architecture-intelligence-page-copy";
import {
  ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_SOURCES,
  ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO,
} from "@/lib/architecture/architecture-intelligence-evidence-copy";

/** Claim discipline + Sources index for Architecture intelligence (AIN). */
export function ArchitectureIntelligenceClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-intelligence"
      claim={ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_INTELLIGENCE_CLAIM_HEADING}
      sourcesIntro={ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO}
      sources={ARCHITECTURE_INTELLIGENCE_SOURCES}
    />
  );
}

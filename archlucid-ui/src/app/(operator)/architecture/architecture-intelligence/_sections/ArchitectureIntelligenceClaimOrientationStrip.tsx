import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";

import {
  ARCHITECTURE_INTELLIGENCE_SOURCES,
  ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO,
} from "@/lib/architecture/architecture-intelligence-evidence-copy";

/** Claim discipline + Sources index for Architecture intelligence (AIN). */
export function ArchitectureIntelligenceClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-intelligence"
      sourcesIntro={ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO}
      sources={ARCHITECTURE_INTELLIGENCE_SOURCES}
    />
  );
}

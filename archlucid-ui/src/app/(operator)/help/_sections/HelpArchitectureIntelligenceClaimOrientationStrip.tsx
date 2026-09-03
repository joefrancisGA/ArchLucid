import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO,
} from "@/lib/architecture-intelligence-help-evidence-copy";

/** Sources follow-ups for `/help/architecture-intelligence` (EAR). */
export function HelpArchitectureIntelligenceClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-intelligence"
      sourcesTestId="help-architecture-intelligence-sources"
      sourcesTitle={ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO}
      sources={ARCHITECTURE_INTELLIGENCE_HELP_SOURCES}
    />
  );
}

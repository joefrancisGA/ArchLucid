import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_SOURCES,
  INTEGRATION_READINESS_HELP_SOURCES_INTRO,
} from "@/lib/integration-readiness-help-evidence-copy";

/** Claim discipline + connector follow-up index for `/help/integration-readiness`. */
export function IntegrationReadinessHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="integration-readiness-help"
      claim={INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={INTEGRATION_READINESS_HELP_SOURCES_INTRO}
      sources={INTEGRATION_READINESS_HELP_SOURCES}
    />
  );
}

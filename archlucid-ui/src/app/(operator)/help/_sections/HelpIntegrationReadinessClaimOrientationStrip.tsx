import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE,
  INTEGRATION_READINESS_HELP_SOURCES,
  INTEGRATION_READINESS_HELP_SOURCES_INTRO,
} from "@/lib/integration-readiness-help-evidence-copy";

/** Sources follow-ups for `/help/integration-readiness` (HEI). */
export function HelpIntegrationReadinessClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-integration-readiness"
      sourcesTestId="help-integration-readiness-sources"
      sourcesTitle={INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={INTEGRATION_READINESS_HELP_SOURCES_INTRO}
      sources={INTEGRATION_READINESS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

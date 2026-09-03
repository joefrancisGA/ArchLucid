import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_HELP_SOURCES,
  SERVICENOW_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/servicenow-integration-help-evidence-copy";

/** Sources follow-ups for `/help/servicenow-integration` (ESX). */
export function HelpServiceNowIntegrationClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-servicenow-integration"
      sourcesTestId="help-servicenow-integration-sources"
      sourcesTitle={SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SERVICENOW_INTEGRATION_HELP_SOURCES_INTRO}
      sources={SERVICENOW_INTEGRATION_HELP_SOURCES}
    />
  );
}

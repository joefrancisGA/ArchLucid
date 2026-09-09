import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_ORIENTATION_SOURCES_INTRO,
  SERVICENOW_INTEGRATION_SOURCES,
} from "@/lib/servicenow-integration-evidence-copy";
import { SERVICENOW_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/servicenow-integration-shell-page-copy";

/** Sources-only follow-ups for `/integrations/servicenow` buyer-polished shell (ISX). */
export function ServiceNowIntegrationSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="servicenow-integration"
      stripTestId={SERVICENOW_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="servicenow-integration-sources"
      sourcesTitle={SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={SERVICENOW_INTEGRATION_ORIENTATION_SOURCES_INTRO}
      sources={SERVICENOW_INTEGRATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}

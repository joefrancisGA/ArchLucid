import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE,
  CLOUD_PROVIDER_CONNECTION_ORIENTATION_SOURCES_INTRO,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

import { AZURE_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID } from "./azure-cloud-connection-page-copy";

/** Sources-only follow-ups for `/integrations/cloud-connections/azure` buyer-polished shell (IAZ). */
export function AzureCloudConnectionSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="cloud-connections-azure"
      stripTestId={AZURE_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="cloud-connections-azure-sources"
      sourcesTitle={CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE}
      sourcesIntro={CLOUD_PROVIDER_CONNECTION_ORIENTATION_SOURCES_INTRO}
      sources={cloudProviderConnectionSources("azure")}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}

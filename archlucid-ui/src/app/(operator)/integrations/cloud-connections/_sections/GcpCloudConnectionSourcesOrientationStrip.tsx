import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE,
  CLOUD_PROVIDER_CONNECTION_ORIENTATION_SOURCES_INTRO,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";

/** Sources-only follow-ups for `/integrations/cloud-connections/gcp` buyer-polished shell (IGC). */
export function GcpCloudConnectionSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="cloud-connections-gcp"
      stripTestId="gcp-cloud-connection-orientation-bottom"
      sourcesTestId="cloud-connections-gcp-sources"
      sourcesTitle={CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE}
      sourcesIntro={CLOUD_PROVIDER_CONNECTION_ORIENTATION_SOURCES_INTRO}
      sources={cloudProviderConnectionSources("gcp")}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}

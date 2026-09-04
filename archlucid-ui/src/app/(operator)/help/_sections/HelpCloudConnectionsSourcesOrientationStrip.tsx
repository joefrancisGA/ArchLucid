import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE,
  CLOUD_CONNECTIONS_SOURCES,
  CLOUD_CONNECTIONS_SOURCES_INTRO,
} from "@/lib/cloud-connections-evidence-copy";

/** Sources-only follow-ups for `/help/cloud-connections` buyer-polished shell (HCE). */
export function HelpCloudConnectionsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-cloud-connections"
      stripTestId="help-cloud-connections-sources-strip"
      sourcesTestId="help-cloud-connections-sources"
      sourcesTitle={CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE}
      sourcesIntro={CLOUD_CONNECTIONS_SOURCES_INTRO}
      sources={CLOUD_CONNECTIONS_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CONNECTION_STATUS_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_SOURCES,
  CONNECTION_STATUS_SOURCES_INTRO,
} from "@/lib/connection-status-evidence-copy";

/** Sources follow-ups for `/administration/connection-status` (ADC). */
export function AdministrationConnectionStatusClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connection-status"
      sourcesTestId="connection-status-sources"
      sourcesTitle={CONNECTION_STATUS_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECTION_STATUS_SOURCES_INTRO}
      sources={CONNECTION_STATUS_SOURCES}
      hubSecondary
    />
  );
}

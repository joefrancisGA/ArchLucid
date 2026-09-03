import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_HELP_SOURCES,
  CONNECTION_STATUS_HELP_SOURCES_INTRO,
} from "@/lib/connection-status-help-evidence-copy";

/** Sources follow-ups for `/help/connection-status` (HCO). */
export function HelpConnectionStatusClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-connection-status"
      sourcesTestId="help-connection-status-sources"
      sourcesTitle={CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECTION_STATUS_HELP_SOURCES_INTRO}
      sources={CONNECTION_STATUS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

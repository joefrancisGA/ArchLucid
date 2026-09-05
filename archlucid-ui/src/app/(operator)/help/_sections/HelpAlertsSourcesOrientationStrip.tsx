import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ALERTS_HELP_FOLLOW_UPS_TITLE,
  ALERTS_HELP_SOURCES,
  ALERTS_HELP_SOURCES_INTRO,
} from "@/lib/alerts-help-evidence-copy";

/** Sources-only follow-ups for `/help/alerts` buyer-polished shell (HA). */
export function HelpAlertsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-alerts"
      sourcesTestId="help-alerts-sources"
      sourcesTitle={ALERTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ALERTS_HELP_SOURCES_INTRO}
      sources={ALERTS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}

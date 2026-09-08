import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ALERTS_INBOX_FOLLOW_UPS_TITLE,
  ALERTS_INBOX_SOURCES,
  ALERTS_INBOX_SOURCES_INTRO,
} from "@/lib/alerts-inbox-evidence-copy";

/** Claim discipline + Sources index for the approval alerts inbox (AL). */
export function AlertsInboxClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="alerts-inbox"
      sourcesTitle={ALERTS_INBOX_FOLLOW_UPS_TITLE}
      sourcesIntro={ALERTS_INBOX_SOURCES_INTRO}
      sources={ALERTS_INBOX_SOURCES}
      hubSecondary
    />
  );
}

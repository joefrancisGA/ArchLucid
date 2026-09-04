import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE,
  NOTIFICATIONS_HELP_SOURCES,
  NOTIFICATIONS_HELP_SOURCES_INTRO,
} from "@/lib/notifications-help-evidence-copy";

/** Sources-only follow-ups for `/help/notifications` buyer-polished shell (HEN). */
export function HelpNotificationsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-notifications"
      sourcesTestId="help-notifications-sources"
      sourcesTitle={NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={NOTIFICATIONS_HELP_SOURCES_INTRO}
      sources={NOTIFICATIONS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}

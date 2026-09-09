"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE,
  NOTIFICATIONS_HELP_SOURCES,
  NOTIFICATIONS_HELP_SOURCES_INTRO,
} from "@/lib/notifications-help-evidence-copy";
import { NOTIFICATIONS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/notifications-help-page-copy";
import {
  helpNotificationsSourcesDisclosureHrefFromSearch,
  parseHelpNotificationsSourcesOpenFromSearch,
} from "@/lib/help/help-notifications-sources-disclosure-url";

/** Sources-only follow-ups for `/help/notifications` buyer-polished shell (HEN). */
export function HelpNotificationsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-notifications-sources"
      searchParamKey="helpNotificationsSourcesOpen"
      parseOpenFromSearch={parseHelpNotificationsSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpNotificationsSourcesDisclosureHrefFromSearch}
      sectionTestId={NOTIFICATIONS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE}
      intro={NOTIFICATIONS_HELP_SOURCES_INTRO}
      links={NOTIFICATIONS_HELP_SOURCES}
      sourcesTestId="help-notifications-sources"
    />
  );
}

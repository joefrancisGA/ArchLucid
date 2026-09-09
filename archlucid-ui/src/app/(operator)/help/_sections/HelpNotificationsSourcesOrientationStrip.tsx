"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useUrlSyncedSourcesDisclosure } from "@/hooks/use-url-synced-sources-disclosure";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
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
  const { sourcesOpen, setSourcesOpen } = useUrlSyncedSourcesDisclosure({
    surfaceId: "help-notifications-sources",
    searchParamKey: "helpNotificationsSourcesOpen",
    parseOpenFromSearch: parseHelpNotificationsSourcesOpenFromSearch,
    disclosureHrefFromSearch: helpNotificationsSourcesDisclosureHrefFromSearch,
  });

  return (
    <CollapsibleSection
      title={NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE}
      summaryLine={NOTIFICATIONS_HELP_SOURCES_INTRO}
      sectionTestId={NOTIFICATIONS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-notifications-sources"
        headingId="where-to-go-next"
        title={NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE}
        intro={NOTIFICATIONS_HELP_SOURCES_INTRO}
        links={NOTIFICATIONS_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}

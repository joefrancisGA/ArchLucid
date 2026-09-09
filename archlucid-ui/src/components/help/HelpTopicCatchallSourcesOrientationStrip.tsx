"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE,
  HELP_TOPIC_CATCHALL_SOURCES,
  HELP_TOPIC_CATCHALL_SOURCES_INTRO,
} from "@/lib/help/help-topic-catchall-evidence-copy";
import { HELP_TOPIC_CATCHALL_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/help/help-topic-catchall-page-copy";
import {
  helpTopicCatchallSourcesDisclosureHrefFromSearch,
  parseHelpTopicCatchallSourcesOpenFromSearch,
} from "@/lib/help/help-topic-catchall-sources-disclosure-url";

/** Sources-only follow-ups for `/help/[...topic]` buyer-polished residual shell (HE.). */
export function HelpTopicCatchallSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-topic-catchall-sources"
      searchParamKey="helpTopicCatchallSourcesOpen"
      parseOpenFromSearch={parseHelpTopicCatchallSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpTopicCatchallSourcesDisclosureHrefFromSearch}
      sectionTestId={HELP_TOPIC_CATCHALL_ORIENTATION_BOTTOM_TEST_ID}
      title={HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE}
      intro={HELP_TOPIC_CATCHALL_SOURCES_INTRO}
      links={HELP_TOPIC_CATCHALL_SOURCES}
      sourcesTestId="help-topic-catchall-sources"
    />
  );
}

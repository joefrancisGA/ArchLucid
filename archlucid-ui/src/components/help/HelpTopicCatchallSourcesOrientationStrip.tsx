import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE,
  HELP_TOPIC_CATCHALL_SOURCES,
  HELP_TOPIC_CATCHALL_SOURCES_INTRO,
} from "@/lib/help/help-topic-catchall-evidence-copy";
import { HELP_TOPIC_CATCHALL_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/help/help-topic-catchall-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Sources-only follow-ups for `/help/[...topic]` buyer-polished residual shell (HE.). */
export function HelpTopicCatchallSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-topic-catchall"
      stripTestId={HELP_TOPIC_CATCHALL_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTitle={HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE}
      sourcesIntro={HELP_TOPIC_CATCHALL_SOURCES_INTRO}
      sources={HELP_TOPIC_CATCHALL_SOURCES}
      sourcesTestId="help-topic-catchall-sources"
      hubSecondary
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

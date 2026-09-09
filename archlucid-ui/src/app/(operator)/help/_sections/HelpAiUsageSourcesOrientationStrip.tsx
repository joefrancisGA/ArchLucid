import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AI_USAGE_HELP_FOLLOW_UPS_TITLE,
  AI_USAGE_HELP_ORIENTATION_SOURCES_INTRO,
  AI_USAGE_HELP_SOURCES,
} from "@/lib/ai-usage-help-evidence-copy";
import { AI_USAGE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/ai-usage-help-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Sources-only follow-ups for `/help/ai-usage` buyer-polished shell (HAI). */
export function HelpAiUsageSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-ai-usage"
      stripTestId={AI_USAGE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="help-ai-usage-sources"
      sourcesTitle={AI_USAGE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AI_USAGE_HELP_ORIENTATION_SOURCES_INTRO}
      sources={AI_USAGE_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}

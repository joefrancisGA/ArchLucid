import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AI_USAGE_HELP_FOLLOW_UPS_TITLE,
  AI_USAGE_HELP_ORIENTATION_SOURCES_INTRO,
  AI_USAGE_HELP_SOURCES,
} from "@/lib/ai-usage-help-evidence-copy";

/** Sources-only follow-ups for `/help/ai-usage` buyer-polished shell (HAI). */
export function HelpAiUsageSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-ai-usage"
      sourcesTestId="help-ai-usage-sources"
      sourcesTitle={AI_USAGE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AI_USAGE_HELP_ORIENTATION_SOURCES_INTRO}
      sources={AI_USAGE_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}

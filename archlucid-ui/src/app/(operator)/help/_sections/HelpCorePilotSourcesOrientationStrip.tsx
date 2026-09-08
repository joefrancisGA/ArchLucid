import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  CORE_PILOT_HELP_FOLLOW_UPS_TITLE,
  CORE_PILOT_HELP_ORIENTATION_SOURCES_INTRO,
  CORE_PILOT_HELP_SOURCES,
} from "@/lib/core-pilot-help-evidence-copy";

/** Sources-only follow-ups for `/help/first-architecture-review` buyer-polished shell (COR). */
export function HelpCorePilotSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="core-pilot-help"
      sourcesTestId="core-pilot-help-sources"
      sourcesTitle={CORE_PILOT_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={CORE_PILOT_HELP_ORIENTATION_SOURCES_INTRO}
      sources={CORE_PILOT_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}

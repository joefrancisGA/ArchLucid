import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
  ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO,
} from "@/lib/architecture-scorecard-help-evidence-copy";

/** Sources-only follow-ups for `/help/architecture-scorecard` buyer-polished shell (HER). */
export function HelpArchitectureScorecardSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-scorecard"
      sourcesTestId="help-architecture-scorecard-sources"
      sourcesTitle={ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE}
      sourcesIntro={ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO}
      sources={ARCHITECTURE_SCORECARD_HELP_SOURCES}
      sourcesHeadingId="related-evidence-and-sources"
      hubSecondary
    />
  );
}

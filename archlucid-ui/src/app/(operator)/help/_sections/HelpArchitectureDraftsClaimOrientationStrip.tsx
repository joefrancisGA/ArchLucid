import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_DRAFTS_HELP_ORIENTATION_SOURCES,
  ARCHITECTURE_DRAFTS_HELP_ORIENTATION_SOURCES_INTRO,
} from "@/lib/architecture-drafts-help-evidence-copy";

/** Sources follow-ups for `/help/architecture-drafts` (HAR). */
export function HelpArchitectureDraftsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-drafts"
      sourcesTestId="help-architecture-drafts-sources"
      sourcesTitle={ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_DRAFTS_HELP_ORIENTATION_SOURCES_INTRO}
      sources={ARCHITECTURE_DRAFTS_HELP_ORIENTATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}

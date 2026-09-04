import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AZURE_BOARDS_HELP_FOLLOW_UPS_TITLE,
  AZURE_BOARDS_HELP_SOURCES,
  AZURE_BOARDS_HELP_SOURCES_INTRO,
} from "@/lib/azure-boards-help-evidence-copy";

/** Sources-only follow-ups for `/help/azure-boards` buyer-polished shell (HEZ). */
export function HelpAzureBoardsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-azure-boards"
      sourcesTestId="help-azure-boards-sources"
      sourcesTitle={AZURE_BOARDS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AZURE_BOARDS_HELP_SOURCES_INTRO}
      sources={AZURE_BOARDS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}

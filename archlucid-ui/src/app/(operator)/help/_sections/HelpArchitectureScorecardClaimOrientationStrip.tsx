import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import {
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
  ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import { cn } from "@/lib/utils";

/** Non-summing ROI + disposition + WK-21 literacy for `/help/architecture-scorecard`. */
export function HelpArchitectureScorecardClaimOrientationStrip(): React.JSX.Element {
  return (
    <>
      <p
        className={cn("m-0 mb-3 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-architecture-scorecard-non-summing-line"
      >
        {SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}
      </p>
      <p
        className={cn("m-0 mb-3 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-architecture-scorecard-disposition-line"
      >
        {FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY}
      </p>
      <PolicyPackInfluenceHonestyChip className="mb-3" />
      <EvidenceOrientationClaimAndSourcesStrip
        slug="help-architecture-scorecard"
        sourcesTestId="help-architecture-scorecard-claim-sources"
        sourcesTitle={ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE}
        sourcesIntro={ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO}
        sources={ARCHITECTURE_SCORECARD_HELP_SOURCES}
      />
    </>
  );
}

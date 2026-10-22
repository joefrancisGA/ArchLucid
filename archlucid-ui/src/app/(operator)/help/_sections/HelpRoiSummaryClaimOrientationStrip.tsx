import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import {
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
  ROI_SUMMARY_HELP_SOURCES_INTRO,
} from "@/lib/roi-summary-help-evidence-copy";
import { cn } from "@/lib/utils";

/** Non-summing ROI + disposition + WK-21 literacy for `/help/roi-summary`. */
export function HelpRoiSummaryClaimOrientationStrip(): React.JSX.Element {
  return (
    <>
      <p
        className={cn("m-0 mb-3 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-roi-summary-non-summing-line"
      >
        {SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}
      </p>
      <p
        className={cn("m-0 mb-3 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-roi-summary-disposition-line"
      >
        {FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY}
      </p>
      <PolicyPackInfluenceHonestyChip className="mb-3" />
      <EvidenceOrientationClaimAndSourcesStrip
        slug="help-roi-summary"
        sourcesTestId="help-roi-summary-claim-sources"
        sourcesTitle={ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE}
        sourcesIntro={ROI_SUMMARY_HELP_SOURCES_INTRO}
        sources={ROI_SUMMARY_HELP_SOURCES}
      />
    </>
  );
}

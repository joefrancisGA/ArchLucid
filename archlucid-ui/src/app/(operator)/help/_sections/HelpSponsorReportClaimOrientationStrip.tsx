import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { cn } from "@/lib/utils";
import {
  SPONSOR_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  SPONSOR_SUMMARY_HELP_SOURCES,
  SPONSOR_SUMMARY_HELP_SOURCES_INTRO,
} from "@/lib/sponsor/sponsor-report-help-evidence-copy";

/** Sources follow-ups for `/help/sponsor-report` (EXE). */
export function HelpSponsorReportClaimOrientationStrip(): React.JSX.Element {
  return (
    <>
      <p
        className={cn("m-0 mb-3 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-sponsor-report-non-summing-line"
      >
        {SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}
      </p>
      <PolicyPackInfluenceHonestyChip className="mb-3" />
      <EvidenceOrientationClaimAndSourcesStrip
      slug="help-sponsor-report"
      sourcesTestId="help-sponsor-report-sources"
      sourcesTitle={SPONSOR_SUMMARY_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SPONSOR_SUMMARY_HELP_SOURCES_INTRO}
      sources={SPONSOR_SUMMARY_HELP_SOURCES}
      />
    </>
  );
}

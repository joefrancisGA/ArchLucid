import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_CLAIM_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE,
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING,
  ROI_SUMMARY_HELP_CLAIM_HEADING_ID,
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
  ROI_SUMMARY_HELP_SOURCES_INTRO,
} from "@/lib/roi-summary-help-evidence-copy";

export type RoiSummaryHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function RoiSummaryHelpEvidenceOrientationStrip(
  props: RoiSummaryHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-roi-summary"
      claim={ROI_SUMMARY_HELP_CLAIM_DISCIPLINE}
      claimHeading={ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ROI_SUMMARY_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      sourcesTitle={ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ROI_SUMMARY_HELP_SOURCES_INTRO}
      sources={ROI_SUMMARY_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
      headingClassName={OPERATOR_TYPOGRAPHY.sectionTitle}
    />
  );
}

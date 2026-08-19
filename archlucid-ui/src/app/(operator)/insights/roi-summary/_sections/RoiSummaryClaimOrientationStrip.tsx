import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ROI_SUMMARY_CLAIM_DISCIPLINE,
  ROI_SUMMARY_CLAIM_DISCIPLINE_HEADING,
  ROI_SUMMARY_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_SOURCES,
  ROI_SUMMARY_SOURCES_INTRO,
} from "@/lib/roi-summary-evidence-copy";

/** Claim discipline + Sources index for ROI summary (SPR). */
export function RoiSummaryClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="roi-summary"
      claim={ROI_SUMMARY_CLAIM_DISCIPLINE}
      claimHeading={ROI_SUMMARY_CLAIM_DISCIPLINE_HEADING}
      sourcesTitle={ROI_SUMMARY_FOLLOW_UPS_TITLE}
      sourcesIntro={ROI_SUMMARY_SOURCES_INTRO}
      sources={ROI_SUMMARY_SOURCES}
    />
  );
}

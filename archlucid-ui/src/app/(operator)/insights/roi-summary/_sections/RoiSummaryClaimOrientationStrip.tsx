import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ROI_SUMMARY_CLAIM_DISCIPLINE,
  ROI_SUMMARY_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_SOURCES,
  ROI_SUMMARY_SOURCES_INTRO,
  ROI_SUMMARY_SPONSOR_HONESTY_LINE,
} from "@/lib/roi-summary-evidence-copy";
import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";

/** Claim discipline + Sources index for ROI summary (SPR). */
export function RoiSummaryClaimOrientationStrip(): React.JSX.Element {
  return (
    <>
      <p className="m-0 mb-3 text-sm text-al-text-secondary" data-testid="roi-summary-non-summing-line">
        {ROI_SUMMARY_SPONSOR_HONESTY_LINE} {POLICY_PACK_INFLUENCE_HONESTY_LINE}
      </p>
      <EvidenceOrientationClaimAndSourcesStrip
        slug="roi-summary"
        claim={ROI_SUMMARY_CLAIM_DISCIPLINE}
        sourcesTitle={ROI_SUMMARY_FOLLOW_UPS_TITLE}
        sourcesIntro={ROI_SUMMARY_SOURCES_INTRO}
        sources={ROI_SUMMARY_SOURCES}
        hubSecondary
      />
    </>
  );
}

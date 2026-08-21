import { formatHours } from "@/lib/roi-assumptions";

/** Used when severity-weighted ROI hours round to zero but committed reviews exist. */
export const SPONSOR_SCORECARD_AVERAGE_MANUAL_REVIEW_HOURS = 3;

export type SponsorScorecardHoursSavedDisplay = {
  readonly valueText: string;
  readonly caption: string;
};

export function resolveSponsorScorecardHoursSavedDisplay(input: {
  hoursRoi: number;
  reviewsCount: number;
  buyerPolished: boolean;
  precommitBlocksExact: boolean;
  averageManualReviewHours?: number;
}): SponsorScorecardHoursSavedDisplay {
  const averageManualReviewHours =
    input.averageManualReviewHours ?? SPONSOR_SCORECARD_AVERAGE_MANUAL_REVIEW_HOURS;

  if (input.hoursRoi > 0) {
    const precommitCaption = input.precommitBlocksExact ? "" : " · pre-commit block count may be capped";

    return {
      valueText: formatHours(input.hoursRoi),
      caption: input.buyerPolished
        ? "Estimated hours saved (methodology in pilot guide)"
        : `Severity-weighted ROI model${precommitCaption}`,
    };
  }

  if (input.reviewsCount <= 0) {
    return {
      valueText: " — ",
      caption: "Not enough severity data",
    };
  }

  const fallbackHours = input.reviewsCount * averageManualReviewHours;

  if (input.buyerPolished) {
    return {
      valueText: " — ",
      caption: "Not enough severity data to estimate hours saved",
    };
  }

  const precommitCaption = input.precommitBlocksExact ? "" : " · pre-commit block count may be capped";

  return {
    valueText: `Est. ${formatHours(fallbackHours)}`,
    caption: `Estimate (${averageManualReviewHours} h × reviews); not severity-weighted${precommitCaption}`,
  };
}

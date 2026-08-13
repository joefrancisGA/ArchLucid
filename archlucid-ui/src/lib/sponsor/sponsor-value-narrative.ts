import type { SponsorScorecardRecommendedAction } from "@/lib/sponsor/sponsor-scorecard-recommended-actions";

export type BuildSponsorValueNarrativeInput = {
  readonly reviewsCount: number;
  readonly findingsCount: number;
  readonly estimatedHoursSaved: number;
  readonly estimatedUsdSavings: number | null;
  readonly topRecommendedAction: SponsorScorecardRecommendedAction | null;
  /** When true, hours saved are labeled as an estimate (buyer-polished shell). */
  readonly qualifyEstimatedHours?: boolean;
};

function formatUsdCompact(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Deterministic synthesis line for sponsor scorecard and dashboard (TB-268). */
export function buildSponsorValueNarrative(input: BuildSponsorValueNarrativeInput): string {
  const reviewsLabel = input.reviewsCount === 1 ? "review" : "reviews";
  const findingsLabel = input.findingsCount === 1 ? "finding" : "findings";
  const hoursRounded = Math.round(input.estimatedHoursSaved);
  const savingsFragment =
    input.estimatedUsdSavings !== null && input.estimatedUsdSavings > 0
      ? `~${formatUsdCompact(input.estimatedUsdSavings)} / `
      : "";

  const topActionFragment =
    input.topRecommendedAction !== null
      ? ` Top action: ${input.topRecommendedAction.headline}.`
      : "";

  const hoursFragment =
    input.qualifyEstimatedHours === true
      ? `~${hoursRounded} h saved (estimated)`
      : `${hoursRounded} h saved`;

  return (
    `This period: ${input.reviewsCount} ${reviewsLabel}, ${input.findingsCount} ${findingsLabel}, ` +
    `${savingsFragment}${hoursFragment}.${topActionFragment}`
  );
}

import { formatUsd } from "@/lib/roi-assumptions";

/** Matches `PilotReviewRoiFormulas` — 50% review-time lever (docs/go-to-market/ROI_MODEL.md §3.1). */
export const ARCHITECTURE_SCORECARD_REVIEW_TIME_LEVER = 0.5;

export type ArchitectureScorecardRoiAssumptions = {
  readonly hoursPerReview: number;
  readonly reviewsPerQuarter: number;
  readonly hourlyCostUsd: number;
};

export type ArchitectureScorecardRoiPreview = {
  readonly annualSavingsUsd: number;
  readonly quarterlySavingsUsd: number;
  readonly statusQuoAnnualUsd: number;
  readonly annualSavingsLabel: string;
  readonly quarterlySavingsLabel: string;
  readonly statusQuoCostLabel: string;
};

export type ArchitectureScorecardAssumptionFieldErrors = {
  readonly hours: string | null;
  readonly reviews: string | null;
  readonly rate: string | null;
};

function parsePositiveNumber(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function parsePositiveInteger(raw: string): number | null {
  const value = parsePositiveNumber(raw);

  if (value === null) {
    return null;
  }

  if (!Number.isInteger(value)) {
    return null;
  }

  return value;
}

export function parseArchitectureScorecardRoiAssumptions(
  hours: string,
  reviews: string,
  rate: string,
): ArchitectureScorecardRoiAssumptions | null {
  const hoursPerReview = parsePositiveNumber(hours);
  const reviewsPerQuarter = parsePositiveInteger(reviews);
  const hourlyCostUsd = parsePositiveNumber(rate);

  if (hoursPerReview === null || reviewsPerQuarter === null || hourlyCostUsd === null) {
    return null;
  }

  return { hoursPerReview, reviewsPerQuarter, hourlyCostUsd };
}

export function architectureScorecardAssumptionFieldErrors(
  hours: string,
  reviews: string,
  rate: string,
): ArchitectureScorecardAssumptionFieldErrors {
  const hoursTrimmed = hours.trim();
  const reviewsTrimmed = reviews.trim();
  const rateTrimmed = rate.trim();

  return {
    hours:
      hoursTrimmed.length === 0
        ? null
        : parsePositiveNumber(hours) === null
          ? "Enter hours saved per review greater than zero."
          : null,
    reviews:
      reviewsTrimmed.length === 0
        ? null
        : parsePositiveInteger(reviews) === null
          ? "Enter whole reviews per quarter greater than zero."
          : null,
    rate:
      rateTrimmed.length === 0
        ? null
        : parsePositiveNumber(rate) === null
          ? "Enter architect hourly cost greater than zero."
          : null,
  };
}

export function areArchitectureScorecardAssumptionsComplete(
  hours: string,
  reviews: string,
  rate: string,
): boolean {
  return parseArchitectureScorecardRoiAssumptions(hours, reviews, rate) !== null;
}

export function annualReviewCostStatusQuoUsd(assumptions: ArchitectureScorecardRoiAssumptions): number {
  return assumptions.reviewsPerQuarter * 4 * assumptions.hoursPerReview * assumptions.hourlyCostUsd;
}

export function annualReviewSavingsFromReviewTimeLeverUsd(
  assumptions: ArchitectureScorecardRoiAssumptions,
): number {
  return annualReviewCostStatusQuoUsd(assumptions) * ARCHITECTURE_SCORECARD_REVIEW_TIME_LEVER;
}

export function buildArchitectureScorecardRoiPreview(
  assumptions: ArchitectureScorecardRoiAssumptions,
): ArchitectureScorecardRoiPreview {
  const statusQuoAnnualUsd = annualReviewCostStatusQuoUsd(assumptions);
  const annualSavingsUsd = annualReviewSavingsFromReviewTimeLeverUsd(assumptions);
  const quarterlySavingsUsd = annualSavingsUsd / 4;

  return {
    annualSavingsUsd,
    quarterlySavingsUsd,
    statusQuoAnnualUsd,
    annualSavingsLabel: formatUsd(annualSavingsUsd),
    quarterlySavingsLabel: formatUsd(quarterlySavingsUsd),
    statusQuoCostLabel: formatUsd(statusQuoAnnualUsd),
  };
}

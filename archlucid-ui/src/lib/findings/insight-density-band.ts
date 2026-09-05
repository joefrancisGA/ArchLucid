import {
  INSIGHT_DENSITY_GENERIC_THRESHOLD,
  isLowInsightDensityScore,
} from "@/lib/governance/governance-findings-density-sort";

/** Scores at or above this value read as decision-grade on the Working findings desk. */
export const INSIGHT_DENSITY_DECISION_GRADE_THRESHOLD = 80;

export type InsightDensityBandId = "decision-grade" | "review" | "generic";

export type InsightDensityBandPresentation = {
  readonly id: InsightDensityBandId;
  readonly label: string;
  readonly honestyLine: string;
};

export const INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE =
  "Checklist coverage stays on the package when the insight-density gate demotes a finding." as const;

const BAND_PRESENTATIONS: Readonly<Record<InsightDensityBandId, InsightDensityBandPresentation>> = {
  "decision-grade": {
    id: "decision-grade",
    label: "Decision-grade",
    honestyLine: INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE,
  },
  review: {
    id: "review",
    label: "Review",
    honestyLine: INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE,
  },
  generic: {
    id: "generic",
    label: "Generic",
    honestyLine: INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE,
  },
};

export function resolveInsightDensityBand(score: number | null | undefined): InsightDensityBandPresentation | null {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return null;
  }

  const normalizedScore = Math.trunc(score);

  if (isLowInsightDensityScore(normalizedScore)) {
    return BAND_PRESENTATIONS.generic;
  }

  if (normalizedScore >= INSIGHT_DENSITY_DECISION_GRADE_THRESHOLD) {
    return BAND_PRESENTATIONS["decision-grade"];
  }

  return BAND_PRESENTATIONS.review;
}

export function formatInsightDensityBandLabel(score: number | null | undefined): string | null {
  const band = resolveInsightDensityBand(score);

  if (band === null) {
    return null;
  }

  return `${band.label} (${Math.trunc(score ?? 0)})`;
}

export { INSIGHT_DENSITY_GENERIC_THRESHOLD };

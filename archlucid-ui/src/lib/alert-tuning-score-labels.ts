import type { NoiseScoreBreakdown } from "@/types/alert-tuning";

export const ALERT_TUNING_RANKING_FACTORS_HEADING = "Ranking factors";

export const ALERT_TUNING_SCORE_AXIS_LABELS = {
  reviewCoverageFit: "Review coverage fit",
  unwantedAlertPenalty: "Unwanted alert penalty",
  overlapSuppressionPenalty: "Overlap suppression penalty",
  alertDensityPenalty: "Alert density penalty",
  overallRankingScore: "Overall ranking score",
} as const;

export type AlertTuningScoreAxisLine = {
  label: string;
  value: string;
  emphasize?: boolean;
};

export function formatAlertTuningScoreAxisLines(breakdown: NoiseScoreBreakdown): AlertTuningScoreAxisLine[] {
  return [
    {
      label: ALERT_TUNING_SCORE_AXIS_LABELS.reviewCoverageFit,
      value: breakdown.coverageScore.toFixed(2),
    },
    {
      label: ALERT_TUNING_SCORE_AXIS_LABELS.unwantedAlertPenalty,
      value: breakdown.noisePenalty.toFixed(2),
    },
    {
      label: ALERT_TUNING_SCORE_AXIS_LABELS.overlapSuppressionPenalty,
      value: breakdown.suppressionPenalty.toFixed(2),
    },
    {
      label: ALERT_TUNING_SCORE_AXIS_LABELS.alertDensityPenalty,
      value: breakdown.densityPenalty.toFixed(2),
    },
    {
      label: ALERT_TUNING_SCORE_AXIS_LABELS.overallRankingScore,
      value: breakdown.finalScore.toFixed(2),
      emphasize: true,
    },
  ];
}

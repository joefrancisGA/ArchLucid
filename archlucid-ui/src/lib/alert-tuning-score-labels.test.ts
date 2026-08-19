import { describe, expect, it } from "vitest";

import {
  ALERT_TUNING_SCORE_AXIS_LABELS,
  formatAlertTuningScoreAxisLines,
} from "@/lib/alert-tuning-score-labels";
import type { NoiseScoreBreakdown } from "@/types/alert-tuning";

const sampleBreakdown: NoiseScoreBreakdown = {
  coverageScore: 0.82,
  noisePenalty: 0.15,
  suppressionPenalty: 0.05,
  densityPenalty: 0.03,
  finalScore: 0.64,
  notes: ["Within target alert volume."],
};

describe("alert-tuning-score-labels", () => {
  it("TB-1593: maps score axes to operator-safe labels without engineering property names", () => {
    const lines = formatAlertTuningScoreAxisLines(sampleBreakdown);

    expect(lines.map((line) => line.label)).toEqual([
      ALERT_TUNING_SCORE_AXIS_LABELS.reviewCoverageFit,
      ALERT_TUNING_SCORE_AXIS_LABELS.unwantedAlertPenalty,
      ALERT_TUNING_SCORE_AXIS_LABELS.overlapSuppressionPenalty,
      ALERT_TUNING_SCORE_AXIS_LABELS.alertDensityPenalty,
      ALERT_TUNING_SCORE_AXIS_LABELS.overallRankingScore,
    ]);

    for (const line of lines) {
      expect(line.label).not.toMatch(/coverageScore|noisePenalty|suppressionPenalty|densityPenalty|finalScore/i);
    }

    expect(lines.at(-1)?.emphasize).toBe(true);
    expect(lines.at(-1)?.value).toBe("0.64");
  });
});

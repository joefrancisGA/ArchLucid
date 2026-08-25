import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertTuningContent } from "@/components/alerts/AlertTuningContent";
import {
  ALERT_TUNING_RANKING_FACTORS_HEADING,
  ALERT_TUNING_SCORE_AXIS_LABELS,
} from "@/lib/alert-tuning-score-labels";
import type { ThresholdRecommendationResult } from "@/types/alert-tuning";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

const apiHoisted = vi.hoisted(() => ({
  recommendAlertThreshold: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  recommendAlertThreshold: apiHoisted.recommendAlertThreshold,
}));

const sampleResult: ThresholdRecommendationResult = {
  evaluatedUtc: "2026-01-01T00:00:00Z",
  ruleKind: "Simple",
  tunedMetricType: "CostIncreasePercent",
  summaryNotes: ["Compared five thresholds against recent reviews."],
  recommendedCandidate: {
    candidate: { thresholdValue: 10, label: "10%" },
    simulationResult: {
      evaluatedRunCount: 8,
      matchedCount: 5,
      wouldCreateCount: 3,
      wouldSuppressCount: 1,
      summaryNotes: [],
      outcomes: [],
    },
    scoreBreakdown: {
      coverageScore: 0.82,
      noisePenalty: 0.15,
      suppressionPenalty: 0.05,
      densityPenalty: 0.03,
      finalScore: 0.64,
      notes: ["Within target alert volume."],
    },
  },
  candidates: [],
};

describe("AlertTuningContent TB-1593", () => {
  beforeEach(() => {
    apiHoisted.recommendAlertThreshold.mockReset();
    apiHoisted.recommendAlertThreshold.mockResolvedValue({
      ...sampleResult,
      candidates: [sampleResult.recommendedCandidate!],
    });
  });

  it("does not render tab-level lead or rank cue chrome", () => {
    render(<AlertTuningContent />);

    expect(screen.queryByTestId("alert-test-alerts-tab-lead")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alert-test-alerts-tab-rank-cue")).not.toBeInTheDocument();
  });

  it("renders operator-safe ranking factor labels without engineering score-axis copy", async () => {
    render(<AlertTuningContent />);

    fireEvent.click(screen.getByRole("button", { name: "Recommend threshold" }));

    await waitFor(() => {
      expect(screen.getAllByText(ALERT_TUNING_RANKING_FACTORS_HEADING).length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText(/Review coverage fit: 0\.82/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Unwanted alert penalty: 0\.15/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Overall ranking score: 0\.64/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("All candidates (highest overall ranking first)")).toBeInTheDocument();
    expect(screen.getByTestId("alert-tuning-recommend-setup-step-recommend")).toHaveTextContent("Done");

    expect(screen.queryByText(/Coverage:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Noise penalty:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/final score/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/coverageScore|noisePenalty|suppressionPenalty|densityPenalty/i)).not.toBeInTheDocument();

    for (const label of Object.values(ALERT_TUNING_SCORE_AXIS_LABELS)) {
      expect(screen.getAllByText(new RegExp(label)).length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("AlertTuningContent TB-1590", () => {
  it("uses design-system Input fields and a primary recommend Button on the tuning form", () => {
    render(<AlertTuningContent />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByTestId("alert-tuning-recommend-setup-progress")).toBeInTheDocument();
    expect(screen.getByTestId("alert-tuning-recommend-setup-step-recommend")).toHaveAttribute(
      "data-emphasized",
      "true",
    );
    expect(screen.getByTestId("alert-tuning-recommend-submit")).toHaveTextContent("Recommend threshold");
  });

  it("tuning form source avoids raw html input and button elements", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "AlertTuningContent.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/<input\b/);
    expect(source).not.toMatch(/<button\b/);
    expect(source).toContain('data-testid="alert-tuning-recommend-submit"');
    expect(source).toContain('variant="primary"');
  });
});

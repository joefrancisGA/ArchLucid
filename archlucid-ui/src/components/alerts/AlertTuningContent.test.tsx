import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertTuningContent } from "@/components/alerts/AlertTuningContent";
import {
  ALERT_TUNING_RANKING_FACTORS_HEADING,
  ALERT_TUNING_SCORE_AXIS_LABELS,
} from "@/lib/alert-tuning-score-labels";
import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import type { ThresholdRecommendationResult } from "@/types/alert-tuning";

const searchParamsState = { value: "tab=test-alerts&runId=run-tune-1" };
const replaceMock = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      replace: replaceMock,
      push: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(searchParamsState.value),
  };
});

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { onChange: (value: string) => void }) => (
    <button type="button" data-testid="ask-run-id-picker" onClick={() => props.onChange("run-picked-1")}>
      pick
    </button>
  ),
}));

vi.mock("@/components/alerts/AlertTuningNextReviewFooterClient", () => ({
  AlertTuningNextReviewFooterClient: () => <div data-testid="alert-tuning-next-review-footer-stub" />,
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
    searchParamsState.value = "tab=test-alerts&runId=run-tune-1";
    replaceMock.mockReset();
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
  beforeEach(() => {
    searchParamsState.value = "tab=test-alerts&runId=run-tune-1";
    replaceMock.mockReset();
  });

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
      join(process.cwd(), "src", "components", "alerts", "AlertTuningForm.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/<input\b/);
    expect(source).not.toMatch(/<button\b/);
    expect(source).toContain('data-testid="alert-tuning-recommend-submit"');
    expect(source).toContain('variant="primary"');
  });
});

describe("AlertTuningContent URL-scoped pick", () => {
  beforeEach(() => {
    searchParamsState.value = "";
    replaceMock.mockReset();
  });

  it("asks the operator to pick a review before tuning", () => {
    render(<AlertTuningContent />);

    expect(screen.getByTestId("alert-tuning-pick-review-before-tuning-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("alert-tuning-run-scope-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alert-tuning-recommend-setup-progress")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Recommend threshold" })).not.toBeInTheDocument();
  });

  it("writes the picked review into the test-alerts URL", () => {
    render(<AlertTuningContent />);

    fireEvent.click(screen.getByTestId("ask-run-id-picker"));

    expect(replaceMock).toHaveBeenCalledWith(`${GOVERNANCE_ALERT_RULES_PATH}?tab=test-alerts&runId=run-picked-1`, {
      scroll: false,
    });
  });

  it("shows the recommend checklist when runId is in the URL", () => {
    searchParamsState.value = "tab=test-alerts&runId=run-tune-1";

    render(<AlertTuningContent />);

    expect(screen.queryByTestId("alert-tuning-pick-review-before-tuning-strip")).not.toBeInTheDocument();
    expect(screen.getByTestId("alert-tuning-run-scope-banner")).toHaveTextContent("run-tune-1");
    expect(screen.getByRole("link", { name: "Clear review scope" })).toHaveAttribute(
      "href",
      "/governance/alert-rules?tab=test-alerts",
    );
    expect(screen.getByRole("link", { name: "Open review" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-tune-1",
    );
    expect(screen.getByTestId("alert-tuning-recommend-setup-progress")).toBeInTheDocument();
    expect(screen.getByTestId("alert-tuning-next-review-footer-stub")).toBeInTheDocument();
  });
});

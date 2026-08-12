import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertSimulationTuningSection } from "@/components/alerts/AlertSimulationTuningSection";
import { alertTestAlertsTabLead } from "@/lib/enterprise-controls-context-copy";

vi.mock("@/components/alerts/AlertSimulationContent", () => ({
  AlertSimulationContent: () => <div data-testid="stub-alert-simulation-content">Simulation</div>,
}));

vi.mock("@/components/alerts/AlertTuningContent", () => ({
  AlertTuningContent: () => <div data-testid="stub-alert-tuning-content">Tuning</div>,
}));

vi.mock("@/components/EnterpriseControlsContextHints", () => ({
  AlertOperatorToolingRankCue: () => <p data-testid="stub-alert-rank-cue">Rank cue</p>,
}));

const apiHoisted = vi.hoisted(() => ({
  simulateAlertRule: vi.fn(),
  compareAlertRuleCandidates: vi.fn(),
  recommendAlertThreshold: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  simulateAlertRule: apiHoisted.simulateAlertRule,
  compareAlertRuleCandidates: apiHoisted.compareAlertRuleCandidates,
  recommendAlertThreshold: apiHoisted.recommendAlertThreshold,
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

describe("AlertSimulationTuningSection TB-1593", () => {
  it("renders one shared tab lead and rank cue above simulate and tune sections", () => {
    render(<AlertSimulationTuningSection />);

    expect(screen.getByTestId("alert-test-alerts-tab-lead")).toHaveTextContent(alertTestAlertsTabLead);
    expect(screen.getByTestId("alert-test-alerts-tab-rank-cue")).toBeInTheDocument();
    expect(screen.getByTestId("stub-alert-rank-cue")).toBeInTheDocument();
    expect(screen.getByTestId("stub-alert-simulation-content")).toBeInTheDocument();
    expect(screen.getByTestId("alert-test-tune-disclosure")).not.toHaveAttribute("open");
    expect(screen.getByTestId("stub-alert-tuning-content")).toBeInTheDocument();
    expect(screen.getAllByTestId("stub-alert-rank-cue")).toHaveLength(1);
  });
});

describe("AlertSimulationTuningSection TB-1589", () => {
  beforeEach(() => {
    vi.resetModules();
    apiHoisted.simulateAlertRule.mockReset();
    apiHoisted.compareAlertRuleCandidates.mockReset();
    apiHoisted.recommendAlertThreshold.mockReset();
    apiHoisted.simulateAlertRule.mockResolvedValue({
      evaluatedRunCount: 0,
      matchedCount: 0,
      wouldCreateCount: 0,
      wouldSuppressCount: 0,
      summaryNotes: [],
      outcomes: [],
    });
    apiHoisted.compareAlertRuleCandidates.mockResolvedValue({
      candidateA: { simulationResult: { evaluatedRunCount: 0, matchedCount: 0, wouldCreateCount: 0, wouldSuppressCount: 0, summaryNotes: [], outcomes: [] } },
      candidateB: { simulationResult: { evaluatedRunCount: 0, matchedCount: 0, wouldCreateCount: 0, wouldSuppressCount: 0, summaryNotes: [], outcomes: [] } },
      summaryNotes: [],
    });
    apiHoisted.recommendAlertThreshold.mockResolvedValue({
      evaluatedUtc: "2026-01-01T00:00:00Z",
      ruleKind: "Simple",
      tunedMetricType: "CostIncreasePercent",
      summaryNotes: [],
      recommendedCandidate: null,
      candidates: [],
    });
  });

  it("demotes simulate to h3 and keeps tuning in a closed disclosure", async () => {
    vi.doUnmock("@/components/alerts/AlertSimulationContent");
    vi.doUnmock("@/components/alerts/AlertTuningContent");

    const { AlertSimulationTuningSection: LiveSection } = await import(
      "@/components/alerts/AlertSimulationTuningSection"
    );

    render(<LiveSection />);

    expect(screen.getByRole("heading", { level: 3, name: "Simulate alerts" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Simulate alerts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Tune alert thresholds" })).not.toBeInTheDocument();

    const disclosure = screen.getByTestId("alert-test-tune-disclosure");

    expect(disclosure).not.toHaveAttribute("open");
    expect(screen.getByRole("heading", { level: 3, name: "Tune alert thresholds" })).toBeInTheDocument();

    fireEvent.click(screen.getByText("Tune alert thresholds"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Recommend threshold" })).toBeInTheDocument();
    });
  });

  it("source avoids page-title h2 chrome in merged test tab panel", () => {
    const sectionSource = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "AlertSimulationTuningSection.tsx"),
      "utf8",
    );
    const simulationSource = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "AlertSimulationContent.tsx"),
      "utf8",
    );
    const tuningSource = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "AlertTuningContent.tsx"),
      "utf8",
    );

    expect(sectionSource).not.toMatch(/<h2\b/);
    expect(simulationSource).not.toMatch(/<h2\b/);
    expect(tuningSource).not.toMatch(/<h2\b/);
  });
});

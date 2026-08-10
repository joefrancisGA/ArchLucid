import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

describe("AlertSimulationTuningSection TB-1593", () => {
  it("renders one shared tab lead and rank cue above simulate and tune sections", () => {
    render(<AlertSimulationTuningSection />);

    expect(screen.getByTestId("alert-test-alerts-tab-lead")).toHaveTextContent(alertTestAlertsTabLead);
    expect(screen.getByTestId("alert-test-alerts-tab-rank-cue")).toBeInTheDocument();
    expect(screen.getByTestId("stub-alert-rank-cue")).toBeInTheDocument();
    expect(screen.getByTestId("stub-alert-simulation-content")).toBeInTheDocument();
    expect(screen.getByTestId("stub-alert-tuning-content")).toBeInTheDocument();
    expect(screen.getAllByTestId("stub-alert-rank-cue")).toHaveLength(1);
  });
});

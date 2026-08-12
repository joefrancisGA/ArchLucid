import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { RunDetailFindingsWorkspace } from "./RunDetailFindingsWorkspace";

vi.mock("@/components/QuickDecisionSummary", () => ({
  QuickDecisionSummary: () => <div data-testid="quick-decision-summary-stub" />,
}));

vi.mock("@/components/findings/FindingsItsmExportToolbar", () => ({
  FindingsItsmExportToolbar: () => null,
}));

function finding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-default",
    title: "Finding",
    recommendation: "Fix it.",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    confidenceLevel: "High",
    ...overrides,
  };
}

describe("RunDetailFindingsWorkspace", () => {
  it("keeps chip counts on the confidence-gated set when a severity filter is active", () => {
    const findings: QuickDecisionFinding[] = [
      finding({ findingId: "f-medium-1", severityValue: 1, findingOrder: 0 }),
      finding({ findingId: "f-medium-2", severityValue: 1, findingOrder: 1 }),
      finding({ findingId: "f-high-1", severityValue: 2, findingOrder: 2 }),
    ];

    render(<RunDetailFindingsWorkspace runId="run-1" findings={findings} />);

    fireEvent.click(screen.getByRole("button", { name: "Medium (2)" }));

    expect(screen.getByRole("button", { name: "All (3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Medium (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "High (1)" })).toBeInTheDocument();
  });

  it("names the confidence gate in the visibility summary when rows are hidden", () => {
    const findings: QuickDecisionFinding[] = [
      finding({ findingId: "f-medium-1", severityValue: 1, findingOrder: 0 }),
      finding({ findingId: "f-medium-2", severityValue: 1, findingOrder: 1 }),
      finding({
        findingId: "f-hidden-low",
        severityValue: 1,
        findingOrder: 2,
        confidenceLevel: "Low",
        enforcementTier: "Advisory",
      }),
    ];

    render(<RunDetailFindingsWorkspace runId="run-1" findings={findings} />);

    expect(screen.getByTestId("run-detail-findings-visibility-summary")).toHaveTextContent(
      "Showing 2 of 3 — 1 hidden by confidence filter",
    );
  });

  it("renders create-home orientation strip and assessment metric without governance queue labels", () => {
    const findings: QuickDecisionFinding[] = [
      finding({ findingId: "f-medium-1", severityValue: 1, findingOrder: 0 }),
    ];

    render(
      <RunDetailFindingsWorkspace
        runId="run-1"
        findings={findings}
        packageCommitted={false}
        analysisStagesComplete={false}
        triageVisibleCount={1}
      />,
    );

    expect(screen.getByTestId("architecture-findings-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-findings-assessment-metric")).toBeInTheDocument();
    expect(screen.queryByTestId("review-findings-secondary-view-strip")).not.toBeInTheDocument();
    expect(screen.queryByText(/Review package findings/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/governance queue/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("run-detail-findings-toolbar")).toHaveAttribute("data-testid", "run-detail-findings-toolbar");
    expect(screen.getByTestId("quick-decision-summary-stub")).toBeInTheDocument();
  });
});

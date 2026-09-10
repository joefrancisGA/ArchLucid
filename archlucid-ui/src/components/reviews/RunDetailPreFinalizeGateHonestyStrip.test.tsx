import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import { RunDetailPreFinalizeGateHonestyStrip } from "./RunDetailPreFinalizeGateHonestyStrip";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

const healthReadyMock = vi.fn();

vi.mock("@/hooks/use-health-ready-summary-query", () => ({
  useHealthReadySummaryQuery: () => healthReadyMock(),
}));

function sampleFinding(
  overrides: Partial<QuickDecisionFinding> = {},
): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Public database ingress",
    severity: "Error",
    classification: "DecisionGradeFinding",
    semanticSupportBand: "Unchecked",
    ...overrides,
  };
}

describe("RunDetailPreFinalizeGateHonestyStrip (DR-04 / AS-064)", () => {
  it("shows the persistent banner when the host gate is disabled", () => {
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: false, status: "Healthy", entries: [] },
    });

    render(<RunDetailPreFinalizeGateHonestyStrip />);

    expect(screen.getByTestId("run-detail-pre-finalize-gate-honesty-strip")).toBeInTheDocument();
    expect(screen.getByText("Finalize will not be blocked by policy")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Serious findings can still be sealed here. This is not a fully governed review record.",
      ),
    ).toBeInTheDocument();
  });

  it("hides when the gate is enabled and no unchecked semantic support rows exist", () => {
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: true, status: "Healthy", entries: [] },
    });

    const { container } = render(
      <RunDetailPreFinalizeGateHonestyStrip
        findings={[sampleFinding({ semanticSupportBand: "Supported" })]}
        manifestFinalized={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows unchecked semantic support warning before finalize without blocking copy", () => {
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: true, status: "Healthy", entries: [] },
    });

    render(
      <RunDetailPreFinalizeGateHonestyStrip
        findings={[sampleFinding()]}
        manifestFinalized={false}
      />,
    );

    expect(screen.getByTestId("run-detail-pre-finalize-unchecked-semantic-support-strip")).toBeInTheDocument();
    expect(screen.getByText("Semantic support is not confirmed for some findings")).toBeInTheDocument();
    expect(screen.getByText(/Structural citations are present/i)).toBeInTheDocument();
    expect(screen.getByText(/Finalize stays enabled/i)).toBeInTheDocument();
    expect(screen.queryByText(/blocked/i)).toBeNull();
  });

  it("hides unchecked semantic support warning after finalize", () => {
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: true, status: "Healthy", entries: [] },
    });

    const { container } = render(
      <RunDetailPreFinalizeGateHonestyStrip
        findings={[sampleFinding()]}
        manifestFinalized={true}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

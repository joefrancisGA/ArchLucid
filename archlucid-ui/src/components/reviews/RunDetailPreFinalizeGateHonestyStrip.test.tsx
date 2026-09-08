import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailPreFinalizeGateHonestyStrip } from "./RunDetailPreFinalizeGateHonestyStrip";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

const healthReadyMock = vi.fn();

vi.mock("@/hooks/use-health-ready-summary-query", () => ({
  useHealthReadySummaryQuery: () => healthReadyMock(),
}));

describe("RunDetailPreFinalizeGateHonestyStrip (DR-04)", () => {
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

  it("hides when the gate is enabled", () => {
    healthReadyMock.mockReturnValue({
      data: { preCommitGateEnabled: true, status: "Healthy", entries: [] },
    });

    const { container } = render(<RunDetailPreFinalizeGateHonestyStrip />);

    expect(container).toBeEmptyDOMElement();
  });
});

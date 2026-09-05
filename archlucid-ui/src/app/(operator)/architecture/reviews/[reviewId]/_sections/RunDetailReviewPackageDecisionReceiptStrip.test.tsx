import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working" }),
}));

vi.mock("@/components/governance/GovernanceRecordCorrectionDialog", () => ({
  GovernanceRecordCorrectionDialog: () => null,
}));

import { RunDetailReviewPackageDecisionReceiptStrip } from "./RunDetailReviewPackageDecisionReceiptStrip";

describe("RunDetailReviewPackageDecisionReceiptStrip (WA-13)", () => {
  it("renders the decision receipt control outside artifacts-only chrome when sealed", () => {
    render(
      <RunDetailReviewPackageDecisionReceiptStrip
        runId="run-1"
        feasibilityVerdict={{
          kind: "SoftInfeasible",
          summary: "Skipped required intake questions block a defensible yes.",
          transparencyTrail: { skipped: [], asserted: [], inferred: [] },
        }}
      />,
    );

    expect(screen.getByTestId("run-detail-stamp-decision-receipt-strip")).toBeInTheDocument();
    expect(screen.getByTestId("decision-receipt-export")).toBeInTheDocument();
    expect(screen.getByTestId("review-finalize-record-correction")).toBeInTheDocument();
  });

  it("renders nothing when no feasibility verdict is available", () => {
    const { container } = render(
      <RunDetailReviewPackageDecisionReceiptStrip runId="run-1" feasibilityVerdict={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

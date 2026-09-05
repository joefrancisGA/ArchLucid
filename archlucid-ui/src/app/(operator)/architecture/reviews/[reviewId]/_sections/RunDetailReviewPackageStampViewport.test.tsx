import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: true }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/components/governance/GovernanceRecordCorrectionDialog", () => ({
  GovernanceRecordCorrectionDialog: () => null,
}));

import { RunDetailReviewPackageStampViewport } from "./RunDetailReviewPackageStampViewport";

const feasibilityVerdict = {
  kind: "SoftInfeasible" as const,
  summary: "Skipped required intake questions block a defensible yes.",
  transparencyTrail: {
    asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
    inferred: [{ key: "latency", value: "Sub-second p95", confidence: "medium" }],
    skipped: [{ questionKey: "drRpo", tier: "Must" as const }],
  },
};

describe("RunDetailReviewPackageStampViewport (FD-05)", () => {
  it("shows receipt and transparency trail together on the sealed Working stamp", () => {
    workspaceModeMock.isWorkingMode = true;

    render(
      <RunDetailReviewPackageStampViewport
        hasGoldenManifest
        runId="run-1"
        feasibilityVerdict={feasibilityVerdict}
        runCompleted
      />,
    );

    expect(screen.getByTestId("run-detail-review-package-stamp-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-stamp-decision-receipt-strip")).toBeInTheDocument();
    expect(screen.getByTestId("transparency-trail-panel")).toBeInTheDocument();
    expect(screen.getByText(/asserted \(1\)/i)).toBeVisible();
    expect(screen.getByText(/inferred \(1\)/i)).toBeVisible();
    expect(screen.getByText(/skipped must questions \(1\)/i)).toBeVisible();
  });

  it("keeps the sealed Guided stamp to receipt only so Overview can own the trail", () => {
    workspaceModeMock.isWorkingMode = false;

    render(
      <RunDetailReviewPackageStampViewport
        hasGoldenManifest
        runId="run-1"
        feasibilityVerdict={feasibilityVerdict}
        runCompleted
      />,
    );

    expect(screen.getByTestId("run-detail-stamp-decision-receipt-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("transparency-trail-panel")).toBeNull();
  });

  it("shows the pre-finalize trail and coverage strip before seal", () => {
    workspaceModeMock.isWorkingMode = true;

    render(
      <RunDetailReviewPackageStampViewport
        hasGoldenManifest={false}
        runId="run-1"
        feasibilityVerdict={feasibilityVerdict}
        runCompleted={false}
        analysisStagesComplete
        transparencyTrail={feasibilityVerdict.transparencyTrail}
      />,
    );

    expect(screen.getByTestId("transparency-trail-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("run-detail-stamp-decision-receipt-strip")).toBeNull();
  });
});

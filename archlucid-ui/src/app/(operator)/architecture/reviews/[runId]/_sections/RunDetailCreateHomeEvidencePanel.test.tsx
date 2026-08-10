import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailCreateHomeEvidencePanel } from "./RunDetailCreateHomeEvidencePanel";

vi.mock("./run-detail-page-view-deferred-chunks", () => ({
  RunDetailCaptureEvidenceSectionDeferred: () => <div data-testid="capture-evidence-section" />,
}));

describe("RunDetailCreateHomeEvidencePanel", () => {
  it("renders scope header and inventory above capture on create-home evidence tab", () => {
    render(
      <RunDetailCreateHomeEvidencePanel
        packageName="Payments platform"
        reviewDateLabel="9 Aug 2026"
        deliverableCount={0}
        evidenceCoverageSummaryLine="0 of 0 open findings have linked evidence"
        linkedFindingCount={0}
        openFindingCount={0}
        items={[]}
        runId="run-abc"
        buyerPolished
      />,
    );

    expect(screen.getByTestId("run-detail-create-home-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-evidence-scope-header")).toBeInTheDocument();
    expect(screen.getByTestId("capture-evidence-section")).toBeInTheDocument();
  });
});

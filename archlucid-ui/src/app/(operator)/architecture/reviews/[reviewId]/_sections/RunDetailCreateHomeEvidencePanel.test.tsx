import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailCreateHomeEvidencePanel } from "./RunDetailCreateHomeEvidencePanel";
import {
  RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CTA_LABEL,
  RUN_DETAIL_CREATE_HOME_EVIDENCE_ORIENTATION_LEAD,
} from "@/lib/runs/run-detail-create-home-evidence-copy";

vi.mock("./RunDetailCreateHomeEvidenceCaptureRegion", () => ({
  RunDetailCreateHomeEvidenceCaptureRegion: () => <div data-testid="capture-evidence-region" />,
}));

describe("RunDetailCreateHomeEvidencePanel", () => {
  it("renders orientation, scope header, inventory, and capture region on create-home evidence tab", () => {
    render(
      <RunDetailCreateHomeEvidencePanel
        packageName="Payments platform"
        reviewDateLabel="9 Aug 2026"
        deliverableCount={0}
        evidenceCoverageSummaryLine="0 of 0 open findings have linked evidence"
        linkedFindingCount={0}
        openFindingCount={0}
        items={[]}
        artifacts={[]}
        runId="run-abc"
        buyerPolished
      />,
    );

    expect(screen.getByTestId("run-detail-create-home-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-create-home-evidence-orientation")).toHaveTextContent(
      RUN_DETAIL_CREATE_HOME_EVIDENCE_ORIENTATION_LEAD,
    );
    expect(screen.getByTestId("run-detail-evidence-scope-header")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-evidence-inventory")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-create-home-evidence-diagram-cross-link")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CTA_LABEL })).toHaveAttribute(
      "href",
      expect.stringContaining("reviewTab=architecture"),
    );
    expect(screen.getByTestId("capture-evidence-region")).toBeInTheDocument();
  });
});

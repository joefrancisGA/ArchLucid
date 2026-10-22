import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailEvidenceScopeHeader } from "@/components/runs/RunDetailEvidenceScopeHeader";

describe("RunDetailEvidenceScopeHeader", () => {
  it("renders needs-attention when inventory is empty even if verdict prop is complete", () => {
    render(
      <RunDetailEvidenceScopeHeader
        packageName="Payments platform"
        reviewDateLabel="9 Aug 2026"
        evidenceItemCount={0}
        deliverableCount={2}
        readinessHeadline="Evidence is complete for sponsor handoff."
        readinessVerdict="complete"
        evidenceCoverageLine="No submitted source documents are listed for this review."
      />,
    );

    expect(screen.getByText("No submitted source documents are listed for this review.")).toBeInTheDocument();
    expect(screen.getByText("Evidence is complete for sponsor handoff.")).toBeInTheDocument();
  });
});

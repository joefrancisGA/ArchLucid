import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_DELIVERABLES_STORED_EMPTY,
  RUN_DETAIL_EVIDENCE_ITEMS_STORED_EMPTY,
  RunDetailEvidenceScopeHeader,
} from "@/components/runs/RunDetailEvidenceScopeHeader";

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
    expect(screen.getByText(RUN_DETAIL_EVIDENCE_ITEMS_STORED_EMPTY)).toBeInTheDocument();
  });

  it("distinguishes omitted counts from stored-empty lists (P-13/P-14)", () => {
    render(
      <RunDetailEvidenceScopeHeader
        packageName="Payments platform"
        reviewDateLabel="9 Aug 2026"
        evidenceItemCount={null}
        deliverableCount={0}
        readinessHeadline="Evidence gaps remain."
        readinessVerdict="gaps"
      />,
    );

    expect(screen.getByText("Evidence item count was not stored.")).toBeInTheDocument();
    expect(screen.getByText(RUN_DETAIL_DELIVERABLES_STORED_EMPTY)).toBeInTheDocument();
  });
});

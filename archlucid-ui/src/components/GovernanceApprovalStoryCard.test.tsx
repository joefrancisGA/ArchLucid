import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceApprovalStoryCard } from "@/components/GovernanceApprovalStoryCard";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

describe("GovernanceApprovalStoryCard", () => {
  it("renders four milestone rows for an approved sample request", () => {
    const row: GovernanceApprovalRequest = {
      approvalRequestId: "demo-approval-1",
      runId: "claims-intake-modernization",
      manifestVersion: "3.4.1",
      sourceEnvironment: "dev",
      targetEnvironment: "test",
      status: "Approved",
      requestedBy: "Taylor Morgan",
      reviewedBy: "Jordan Lee",
      requestComment: "Promote finalized intake manifest.",
      reviewComment: "Approved",
      requestedUtc: "2026-01-14T21:00:00.000Z",
      reviewedUtc: "2026-01-14T22:05:00.000Z",
    };

    render(<GovernanceApprovalStoryCard row={row} />);

    expect(screen.getByText(/Approval status for this review/i)).toBeInTheDocument();
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Ready to promote")).toBeInTheDocument();
    expect(screen.getByText("Eligible promotion path: Development → Staging")).toBeInTheDocument();
  });
});

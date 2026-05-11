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

    expect(screen.getByText(/This package completed the approval path/i)).toBeInTheDocument();
    expect(screen.getByText("Submitted for review")).toBeInTheDocument();
    expect(screen.getByText("Architecture review completed")).toBeInTheDocument();
    // Label and detail use the same copy when the step is complete.
    expect(screen.getAllByText("Governance approval recorded")).toHaveLength(2);
    expect(screen.getByText("Eligible for controlled use")).toBeInTheDocument();
    expect(screen.getByText("Eligible promotion path: Development → Staging")).toBeInTheDocument();
  });
});

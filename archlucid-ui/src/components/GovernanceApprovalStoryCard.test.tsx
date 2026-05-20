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
    expect(screen.getByText("Governance approval recorded")).toBeInTheDocument();
    expect(screen.getByText(/Recorded 2026-01-14T22:05:00\.000Z/)).toBeInTheDocument();
    expect(screen.getByText("Approved as architecture decision record")).toBeInTheDocument();
    expect(
      screen.getByText(/Ready for implementation planning, subject to enterprise change control\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/manifest version/i)).toBeInTheDocument();
    const recordedPackageParagraph = screen.getByText(/Recorded package:/i).closest("p");
    expect(recordedPackageParagraph).toHaveTextContent("3.4.1");
    expect(screen.queryByText(/Development → Staging/)).toBeNull();
  });

  it("renders audit trail link in the card footer when auditTrailHref is provided", () => {
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

    render(
      <GovernanceApprovalStoryCard row={row} auditTrailHref="/audit?runId=claims-intake-modernization" />,
    );

    const link = screen.getByRole("link", { name: "Open audit trail" });

    expect(link).toHaveAttribute("href", "/audit?runId=claims-intake-modernization");
  });
});

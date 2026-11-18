import { describe, expect, it } from "vitest";

import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

import {
  filterGovernanceApprovalsByStatusFilter,
  parseGovernanceApprovalStatusFilter,
} from "./governance-approval-status-filter";

function row(status: string): GovernanceApprovalRequest {
  return {
    approvalRequestId: `req-${status}`,
    runId: "run-1",
    manifestVersion: "v1",
    status,
    sourceEnvironment: "dev",
    targetEnvironment: "prod",
    requestedBy: "Alex",
    requestedUtc: "2026-01-01T00:00:00Z",
    reviewedBy: null,
    reviewedUtc: null,
    requestComment: null,
    reviewComment: null,
  };
}

describe("governance approval status filter", () => {
  it("parses pending, approved, and rejected filters", () => {
    expect(parseGovernanceApprovalStatusFilter("pending")).toBe("pending");
    expect(parseGovernanceApprovalStatusFilter("approved")).toBe("approved");
    expect(parseGovernanceApprovalStatusFilter("rejected")).toBe("rejected");
    expect(parseGovernanceApprovalStatusFilter("unknown")).toBeNull();
  });

  it("filters approval rows by normalized status", () => {
    const approvals = [row("Submitted"), row("Approved"), row("Rejected")];

    expect(filterGovernanceApprovalsByStatusFilter(approvals, "pending")).toHaveLength(1);
    expect(filterGovernanceApprovalsByStatusFilter(approvals, "approved")).toHaveLength(1);
    expect(filterGovernanceApprovalsByStatusFilter(approvals, "rejected")).toHaveLength(1);
    expect(filterGovernanceApprovalsByStatusFilter(approvals, null)).toHaveLength(3);
  });
});
import { describe, expect, it } from "vitest";

import { resolveApprovalQueueTriageFirstPending } from "@/lib/governance/resolve-approval-queue-triage-first-pending";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

function approval(overrides: Partial<GovernanceApprovalRequest> = {}): GovernanceApprovalRequest {
  return {
    approvalRequestId: "req-1",
    runId: "run-1",
    manifestVersion: "v1",
    sourceEnvironment: "dev",
    targetEnvironment: "prod",
    status: "Submitted",
    requestedBy: "owner",
    reviewedBy: null,
    requestComment: null,
    reviewComment: null,
    requestedUtc: "2026-02-01T00:00:00Z",
    reviewedUtc: null,
    ...overrides,
  };
}

describe("resolveApprovalQueueTriageFirstPending", () => {
  it("returns the oldest pending approval request", () => {
    const target = resolveApprovalQueueTriageFirstPending([
      approval({ approvalRequestId: "req-new", requestedUtc: "2026-02-02T00:00:00Z" }),
      approval({ approvalRequestId: "req-old", requestedUtc: "2026-01-01T00:00:00Z" }),
    ]);

    expect(target?.approvalRequestId).toBe("req-old");
  });

  it("ignores approved requests", () => {
    expect(
      resolveApprovalQueueTriageFirstPending([approval({ status: "Approved" })]),
    ).toBeNull();
  });
});

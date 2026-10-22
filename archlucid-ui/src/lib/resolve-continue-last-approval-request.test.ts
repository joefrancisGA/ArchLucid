import { describe, expect, it } from "vitest";

import { resolveContinueLastApprovalRequest } from "@/lib/resolve-continue-last-approval-request";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

function request(overrides: Partial<GovernanceApprovalRequest> = {}): GovernanceApprovalRequest {
  return {
    approvalRequestId: "req-1",
    runId: "run-1",
    manifestVersion: "v1",
    sourceEnvironment: "dev",
    targetEnvironment: "prod",
    status: "Submitted",
    requestedBy: "Ada",
    reviewedBy: null,
    requestComment: null,
    reviewComment: null,
    requestedUtc: "2026-01-01T00:00:00Z",
    reviewedUtc: null,
    ...overrides,
  };
}

describe("resolveContinueLastApprovalRequest", () => {
  it("returns null when input is not an array", () => {
    expect(resolveContinueLastApprovalRequest(null)).toBeNull();
    expect(resolveContinueLastApprovalRequest({})).toBeNull();
    expect(resolveContinueLastApprovalRequest("nope")).toBeNull();
    expect(resolveContinueLastApprovalRequest([])).toBeNull();
  });

  it("falls back to the most recently requested approval when no recent view exists", () => {
    const match = resolveContinueLastApprovalRequest([
      request({ approvalRequestId: "req-old", requestedUtc: "2025-01-01T00:00:00Z", manifestVersion: "old" }),
      request({ approvalRequestId: "req-new", requestedUtc: "2026-06-01T00:00:00Z", manifestVersion: "new" }),
    ]);

    expect(match?.approvalRequestId).toBe("req-new");
  });
});

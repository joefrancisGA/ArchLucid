import { describe, expect, it } from "vitest";

import { resolveNextApprovalRequest } from "@/lib/resolve-next-approval-request";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

function request(overrides: Partial<GovernanceApprovalRequest> = {}): GovernanceApprovalRequest {
  return {
    approvalRequestId: "apr-1",
    runId: "run-1",
    manifestVersion: "v1",
    sourceEnvironment: "dev",
    targetEnvironment: "prod",
    status: "Pending",
    requestedBy: "alex@contoso.com",
    reviewedBy: null,
    requestComment: "Promote claims",
    reviewComment: null,
    requestedUtc: "2026-08-01T00:00:00.000Z",
    reviewedUtc: null,
    ...overrides,
  };
}

describe("resolveNextApprovalRequest", () => {
  it("returns the next older request in queue order", () => {
    const next = resolveNextApprovalRequest(
      [
        request({
          approvalRequestId: "newer",
          requestComment: "Newer",
          requestedUtc: "2026-08-20T00:00:00.000Z",
        }),
        request({
          approvalRequestId: "older",
          requestComment: "Older",
          requestedUtc: "2026-08-01T00:00:00.000Z",
        }),
      ],
      "newer",
    );

    expect(next?.approvalRequestId).toBe("older");
    expect(next?.href).toBe("/governance/approval-requests/older/lineage");
    expect(next?.title).toBe("Older");
  });
});

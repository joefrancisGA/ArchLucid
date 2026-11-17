import { describe, expect, it } from "vitest";

import { resolveApprovalBlockerPresentation } from "./run-detail-approval-blocker-presentation";

describe("resolveApprovalBlockerPresentation (P-02)", () => {
  it("returns null when approval is not blocked", () => {
    expect(
      resolveApprovalBlockerPresentation({
        approvalBlocked: false,
        blockingFindingId: "f-1",
        blockingFindingTitle: "Title",
      }),
    ).toBeNull();
  });

  it("surfaces severity-first blocker when ids are present", () => {
    const result = resolveApprovalBlockerPresentation({
      approvalBlocked: true,
      blockingFindingId: "f-1",
      blockingFindingTitle: "Encrypt stores",
      usesStoredApprovalBlocker: false,
    });

    expect(result).toEqual({
      show: true,
      findingId: "f-1",
      findingTitle: "Encrypt stores",
      usesStoredApprovalBlocker: false,
    });
  });
});

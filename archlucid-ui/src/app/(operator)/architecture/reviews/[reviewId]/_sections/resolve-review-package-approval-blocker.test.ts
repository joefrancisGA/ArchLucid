import { describe, expect, it } from "vitest";

import {
  buildReviewPackageRerunHref,
  resolveReviewPackageApprovalBlockerKind,
  resolveReviewPackageBlockerHelperText,
} from "./resolve-review-package-approval-blocker";

const baseInput = {
  runId: "run-abc",
  manifestId: "manifest-1" as string | null,
  hasCommitBlockingFailures: false,
  blockingFindingCount: 0,
  buyerPolishedArtifactTable: true,
  operatorGovernanceDecision: null as string | null,
  manifestStatus: "Draft" as string | null,
  runCompleted: true,
  commitBlockedReason: null as string | null,
};

describe("resolveReviewPackageApprovalBlockerKind", () => {
  it("prioritizes finding coverage failures over unresolved findings", () => {
    expect(
      resolveReviewPackageApprovalBlockerKind({
        ...baseInput,
        hasCommitBlockingFailures: true,
        blockingFindingCount: 2,
        commitBlockedReason: null,
      }),
    ).toBe("finding-coverage-failed");
  });

  it("treats partial assessment copy as an incomplete-assessment blocker", () => {
    expect(
      resolveReviewPackageApprovalBlockerKind({
        ...baseInput,
        commitBlockedReason: "Assessment coverage is incomplete for cost. Re-run the review before finalizing.",
      }),
    ).toBe("incomplete-assessment");
  });

  it("treats unresolved findings as the blocker when no assessment failure is present", () => {
    expect(
      resolveReviewPackageApprovalBlockerKind({
        ...baseInput,
        blockingFindingCount: 1,
      }),
    ).toBe("blocking-findings");
  });
});

describe("resolveReviewPackageBlockerHelperText", () => {
  it("returns the assessment summary for incomplete coverage", () => {
    expect(
      resolveReviewPackageBlockerHelperText("incomplete-assessment", {
        blockingFindingCount: 0,
        commitBlockedSummary: "Assessment coverage is incomplete for architecture structure. Re-run the review before finalizing.",
      }),
    ).toContain("architecture structure");
  });

  it("returns the unresolved finding count for finding blockers", () => {
    expect(
      resolveReviewPackageBlockerHelperText("blocking-findings", {
        blockingFindingCount: 2,
        commitBlockedSummary: null,
      }),
    ).toBe("2 unresolved findings currently block approval.");
  });
});

describe("buildReviewPackageRerunHref", () => {
  it("builds the guided intake rerun route", () => {
    expect(buildReviewPackageRerunHref("run-abc")).toBe(
      "/architecture/reviews/new?path=guided-intake&rerun=run-abc",
    );
  });
});

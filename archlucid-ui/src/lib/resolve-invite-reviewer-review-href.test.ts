import { describe, expect, it } from "vitest";

import { resolveInviteReviewerReviewHref } from "@/lib/resolve-invite-reviewer-review-href";

describe("resolveInviteReviewerReviewHref (SY-23 / SY-24)", () => {
  it("SY-23: Working invite back and share links nest under architecture when id is known", () => {
    expect(
      resolveInviteReviewerReviewHref({
        workingMode: true,
        runId: "run-abc",
        architectureId: "architecture-identity-001",
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-abc");
    expect(
      resolveInviteReviewerReviewHref({
        workingMode: true,
        runId: "run-abc",
        architectureId: "architecture-identity-001",
      }),
    ).not.toContain("/architecture/reviews/run-abc");
  });

  it("SY-23: resolves architecture id from run summary requestId on Working", () => {
    expect(
      resolveInviteReviewerReviewHref({
        workingMode: true,
        runId: "run-abc",
        requestId: "architecture-identity-001",
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-abc");
  });

  it("SY-24: Guided invite success links keep peer review URLs", () => {
    expect(
      resolveInviteReviewerReviewHref({
        workingMode: false,
        runId: "run-abc",
        architectureId: "architecture-identity-001",
      }),
    ).toBe("/architecture/reviews/run-abc");
  });

  it("falls back to home when Working has no review or architecture context", () => {
    expect(
      resolveInviteReviewerReviewHref({
        workingMode: true,
      }),
    ).toBe("/");
  });
});

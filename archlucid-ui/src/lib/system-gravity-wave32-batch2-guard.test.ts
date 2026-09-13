import { describe, expect, it } from "vitest";

import { resolveAuditTrailReviewHref } from "@/lib/resolve-audit-trail-review-href";
import { resolveInviteReviewerReviewHref } from "@/lib/resolve-invite-reviewer-review-href";
import { resolveFirstReviewGuideRunHref } from "@/lib/first-review-guide-status";
import { resolveStartReviewSourceArchitectureId } from "@/lib/architecture/architecture-routes";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { workingShareHref } from "@/lib/architecture/working-share-href";
import { classifyWorkingRoutePathname } from "@/lib/routing/working-route-roles";
import { resolveSystemNotJobWorkingResumeReviewHref } from "@/lib/system-not-job-portfolio-resume-href";

/** ADR 0098 ratchets for SG-028/034/045/047/048/042/094 batch 2 leftovers. */
describe("system-gravity wave 32 batch 2 ratchets (ADR 0098)", () => {
  const architectureId = "architecture-identity-001";
  const runId = "run-abc";

  it("SG-028: audit trail deep links keep nested architecture parent on Working", () => {
    expect(
      resolveAuditTrailReviewHref({
        workingMode: true,
        runId,
        architectureId,
      }),
    ).toBe(`/architecture/architectures/${architectureId}/reviews/${runId}`);
  });

  it("SG-034: share href keeps nested findings URL when parent is known", () => {
    expect(
      workingShareHref({ architectureId, reviewId: runId }).href,
    ).toBe(`/architecture/architectures/${architectureId}/findings?runId=${runId}`);
  });

  it("SG-045: first-review guide primary href nests under architecture on Working", () => {
    expect(
      resolveFirstReviewGuideRunHref(runId, {
        workingMode: true,
        architectureId,
      }),
    ).toBe(`/architecture/architectures/${architectureId}/reviews/${runId}`);
  });

  it("SG-047: unlinked Working review stays honest peer URL", () => {
    expect(
      resolveWorkingRunReviewLocator({ runId: "run-unlinked" }).href,
    ).toBe("/architecture/reviews/run-unlinked");
  });

  it("SG-048: start-review source prefers ArchitectureId over draft id", () => {
    expect(
      resolveStartReviewSourceArchitectureId({
        parentArchitectureId: architectureId,
        draftArchitectureId: "draft-001",
      }),
    ).toBe(architectureId);
  });

  it("SG-042: reviewTab deep links classify as nested job, not locator or inbox", () => {
    expect(
      classifyWorkingRoutePathname(
        `/architecture/architectures/${architectureId}/reviews/${runId}?reviewTab=findings`,
      ),
    ).toBe("nestedJob");
    expect(classifyWorkingRoutePathname("/architecture/reviews")).toBe("inbox");
    expect(classifyWorkingRoutePathname(`/architecture/architectures/${architectureId}`)).toBe("locator");
  });

  it("SG-094: Working portfolio resume lands on architecture desk, not peer reviewDetailPath", () => {
    expect(
      resolveSystemNotJobWorkingResumeReviewHref({
        runId,
        architectureId,
        workingMode: true,
      }),
    ).toBe(`/architecture/architectures/${architectureId}?highlightReviewId=${runId}`);
    expect(
      resolveSystemNotJobWorkingResumeReviewHref({
        runId,
        architectureId,
        workingMode: true,
      }),
    ).not.toMatch(/^\/architecture\/reviews\//);
  });

  it("SG-046: Guided invite flow keeps peer review URLs", () => {
    expect(
      resolveInviteReviewerReviewHref({
        workingMode: false,
        runId,
        architectureId,
      }),
    ).toBe(`/architecture/reviews/${runId}`);
  });
});

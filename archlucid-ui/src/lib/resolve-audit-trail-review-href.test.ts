import { describe, expect, it } from "vitest";

import { resolveAuditTrailReviewHref } from "@/lib/resolve-audit-trail-review-href";

describe("resolveAuditTrailReviewHref (SY-28)", () => {
  const draftRegistryEntries = [
    {
      draftId: "draft-001",
      displayName: "Payments",
      customerStatus: "in-review" as const,
      ownerLabel: "You",
      lastUpdatedUtc: "2026-01-01T00:00:00.000Z",
      linkedReviewId: "run-abc",
      serverUpdatedUtc: "2026-01-01T00:00:00.000Z",
      parentArchitectureId: "architecture-identity-001",
    },
  ];

  it("SY-28: nests under architecture on Working when parent id is known", () => {
    expect(
      resolveAuditTrailReviewHref({
        workingMode: true,
        runId: "run-abc",
        architectureId: "architecture-identity-001",
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-abc");
    expect(
      resolveAuditTrailReviewHref({
        workingMode: true,
        runId: "run-abc",
        architectureId: "architecture-identity-001",
      }),
    ).not.toContain("/architecture/reviews/run-abc");
  });

  it("resolves architecture id from draft registry on Working", () => {
    expect(
      resolveAuditTrailReviewHref({
        workingMode: true,
        runId: "run-abc",
        draftRegistryEntries,
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-abc");
  });

  it("keeps peer review URL on Guided", () => {
    expect(
      resolveAuditTrailReviewHref({
        workingMode: false,
        runId: "run-abc",
        architectureId: "architecture-identity-001",
      }),
    ).toBe("/architecture/reviews/run-abc");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const deskFixture = vi.hoisted(() => ({ id: "architecture-alerts-001", reads: 0 }));
import { resolveOperatorScopedRunReviewHref } from "@/lib/operator-scoped-run-review-href";

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: () => {
    deskFixture.reads += 1;
    return deskFixture.id;
  },
}));

describe("resolveOperatorScopedRunReviewHref", () => {
  beforeEach(() => {
    deskFixture.id = "architecture-alerts-001";
    deskFixture.reads = 0;
  });
  it("opens nested review when architecture id is on the scope banner", () => {
    expect(
      resolveOperatorScopedRunReviewHref("run-alert-1", "architecture-explicit-002"),
    ).toBe("/architecture/architectures/architecture-explicit-002/reviews/run-alert-1");
  });

  it("uses desk cache when architecture id is not pinned on the page", () => {
    expect(resolveOperatorScopedRunReviewHref("run-alert-2")).toBe(
      "/architecture/architectures/architecture-alerts-001/reviews/run-alert-2",
    );
    expect(deskFixture.reads).toBeGreaterThan(0);
  });
});

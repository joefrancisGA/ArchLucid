import { describe, expect, it, vi } from "vitest";

import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { resolveOperatorScopedRunReviewHref } from "@/lib/operator-scoped-run-review-href";

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: vi.fn(() => "architecture-alerts-001"),
}));

describe("resolveOperatorScopedRunReviewHref", () => {
  it("opens nested review when architecture id is on the scope banner", () => {
    expect(
      resolveOperatorScopedRunReviewHref("run-alert-1", "architecture-explicit-002"),
    ).toBe("/architecture/architectures/architecture-explicit-002/reviews/run-alert-1");
  });

  it("uses desk cache when architecture id is not pinned on the page", () => {
    expect(resolveOperatorScopedRunReviewHref("run-alert-2")).toBe(
      "/architecture/architectures/architecture-alerts-001/reviews/run-alert-2",
    );
    expect(vi.mocked(readCachedLastOpenArchitectureId)).toHaveBeenCalled();
  });
});

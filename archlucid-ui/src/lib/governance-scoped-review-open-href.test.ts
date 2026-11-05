import { describe, expect, it, vi } from "vitest";

import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { resolveGovernanceScopedReviewOpenHref } from "@/lib/governance-scoped-review-open-href";

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: vi.fn(() => null),
}));

describe("resolveGovernanceScopedReviewOpenHref", () => {
  it("opens nested review when architecture id is on the schedule", () => {
    expect(
      resolveGovernanceScopedReviewOpenHref({
        runId: "run-nested",
        architectureId: "architecture-desk-001",
      }),
    ).toBe("/architecture/architectures/architecture-desk-001/reviews/run-nested");
  });

  it("uses desk cache when locator has no architecture parent", () => {
    vi.mocked(readCachedLastOpenArchitectureId).mockReturnValue("architecture-cached-002");

    expect(
      resolveGovernanceScopedReviewOpenHref({
        runId: "run-peer",
        requestId: null,
      }),
    ).toBe("/architecture/architectures/architecture-cached-002/reviews/run-peer");
  });
});

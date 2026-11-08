import { describe, expect, it, vi } from "vitest";

import { resolveWorkingReviewChildSuffixHref } from "@/lib/architecture/working-review-child-suffix-href";

vi.mock("@/lib/global-search-desk-architecture-id", () => ({
  resolveGlobalSearchDeskArchitectureId: vi.fn(() => null),
}));

describe("resolveWorkingReviewChildSuffixHref", () => {
  it("uses nested review base for print when architecture id is explicit", () => {
    expect(
      resolveWorkingReviewChildSuffixHref("run-1", "print", { architectureId: "arch-desk" }),
    ).toBe("/architecture/architectures/arch-desk/reviews/run-1/print");
  });

  it("falls back to peer print path when architecture is unknown", () => {
    expect(resolveWorkingReviewChildSuffixHref("run-peer", "print")).toBe(
      "/architecture/reviews/run-peer/print",
    );
  });

  it("uses desk continuity resolver when explicit architecture is absent", async () => {
    const { resolveGlobalSearchDeskArchitectureId } = await import("@/lib/global-search-desk-architecture-id");

    vi.mocked(resolveGlobalSearchDeskArchitectureId).mockReturnValueOnce("arch-continuity");

    expect(resolveWorkingReviewChildSuffixHref("run-1", "provenance")).toBe(
      "/architecture/architectures/arch-continuity/reviews/run-1/provenance",
    );
  });
});

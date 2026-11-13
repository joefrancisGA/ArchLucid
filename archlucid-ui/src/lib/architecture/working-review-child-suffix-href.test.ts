import { beforeEach, describe, expect, it } from "vitest";

import { resolveWorkingReviewChildSuffixHref } from "@/lib/architecture/working-review-child-suffix-href";

describe("resolveWorkingReviewChildSuffixHref", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("uses nested review base for print when architecture id is explicit", () => {
    expect(
      resolveWorkingReviewChildSuffixHref("run-1", "print", { architectureId: "arch-desk" }),
    ).toBe("/architecture/architectures/arch-desk/reviews/run-1/print");
  });

  it("falls back to peer print path when architecture is unknown", () => {
    expect(
      resolveWorkingReviewChildSuffixHref("run-peer", "print", { pathname: "/architecture/reviews/run-peer" }),
    ).toBe("/architecture/reviews/run-peer/print");
  });

  it("uses pathname desk continuity when explicit architecture is absent", () => {
    expect(
      resolveWorkingReviewChildSuffixHref("run-1", "provenance", {
        pathname: "/architecture/architectures/arch-continuity/reviews/run-1",
      }),
    ).toBe("/architecture/architectures/arch-continuity/reviews/run-1/provenance");
  });
});

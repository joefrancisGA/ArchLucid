import { describe, expect, it } from "vitest";

import { resolveFirstReviewGuideRunHref } from "@/lib/first-review-guide-status";

describe("resolveFirstReviewGuideRunHref (Working desk)", () => {
  it("uses nested architecture review path when workingMode and architectureId are set", () => {
    expect(
      resolveFirstReviewGuideRunHref("run-abc", {
        workingMode: true,
        architectureId: "architecture-identity-001",
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-abc");
  });

  it("falls back to peer review path when architecture id is missing", () => {
    expect(
      resolveFirstReviewGuideRunHref("run-abc", {
        workingMode: true,
        architectureId: null,
      }),
    ).toBe("/architecture/reviews/run-abc");
  });
});

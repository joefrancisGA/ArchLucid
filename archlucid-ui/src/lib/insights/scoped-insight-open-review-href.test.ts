import { describe, expect, it } from "vitest";

import { resolveScopedInsightOpenReviewHref } from "@/lib/insights/scoped-insight-open-review-href";

describe("resolveScopedInsightOpenReviewHref", () => {
  it("opens findings workspace when a primary finding is cited", () => {
    const href = resolveScopedInsightOpenReviewHref("run-a", { primaryFindingId: "finding-1" });

    expect(href).toContain("run-a");
    expect(href).toContain("findingId=finding-1");
    expect(href).toContain("reviewTab=findings");
  });

  it("uses working review open when no finding is cited", () => {
    expect(resolveScopedInsightOpenReviewHref("run-42", { architectureId: "architecture-identity-001" })).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-42",
    );
  });
});

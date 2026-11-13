import { describe, expect, it } from "vitest";

import { resolveScopedInsightOpenReviewHref } from "@/lib/insights/scoped-insight-open-review-href";

describe("resolveScopedInsightOpenReviewHref", () => {
  it("opens findings workspace when a primary finding is cited", () => {
    const href = resolveScopedInsightOpenReviewHref("run-a", { primaryFindingId: "finding-1" });

    expect(href).toContain("run-a");
    expect(href).toContain("findingId=finding-1");
    expect(href).toContain("reviewTab=findings");
  });

  it("keeps a cited finding on the known Working architecture desk", () => {
    expect(
      resolveScopedInsightOpenReviewHref("run-a", {
        primaryFindingId: "finding-1",
        architectureId: "architecture-identity-001",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/findings?runId=run-a&focusedFinding=finding-1",
    );
  });

  it("uses working review open when no finding is cited", () => {
    expect(resolveScopedInsightOpenReviewHref("run-42", { architectureId: "architecture-identity-001" })).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-42",
    );
  });
});

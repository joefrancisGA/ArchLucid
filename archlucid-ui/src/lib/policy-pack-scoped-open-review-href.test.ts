import { describe, expect, it } from "vitest";

import { resolvePolicyPackScopedOpenReviewHref } from "@/lib/policy-pack-scoped-open-review-href";

describe("resolvePolicyPackScopedOpenReviewHref", () => {
  it("falls back to peer inbox when architecture is unknown", () => {
    expect(resolvePolicyPackScopedOpenReviewHref("run-peer")).toBe("/architecture/reviews/run-peer");
  });
});

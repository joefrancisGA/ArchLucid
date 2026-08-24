import { describe, expect, it } from "vitest";

import { buildPolicyPacksHrefWithReviewId } from "@/lib/policy-packs-review-handoff";

describe("buildPolicyPacksHrefWithReviewId", () => {
  it("appends reviewId query param for policy pack assignment handoff", () => {
    expect(buildPolicyPacksHrefWithReviewId("run-123")).toBe("/governance/policy-packs?reviewId=run-123");
  });
});

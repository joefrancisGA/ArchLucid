import { describe, expect, it } from "vitest";

import {
  buildPolicyPacksHrefWithReviewId,
  buildPolicyPacksImpactPreviewHref,
  resolveCompareGovernancePackImpactHandoff,
} from "@/lib/policy-packs-review-handoff";

describe("buildPolicyPacksHrefWithReviewId", () => {
  it("appends reviewId query param for policy pack assignment handoff", () => {
    expect(buildPolicyPacksHrefWithReviewId("run-123")).toBe("/governance/policy-packs?reviewId=run-123");
  });
});

describe("buildPolicyPacksImpactPreviewHref", () => {
  it("includes packAId and packBId when provided", () => {
    expect(
      buildPolicyPacksImpactPreviewHref({
        reviewId: "run-123",
        packAId: "pack-a",
        packBId: "pack-b",
      }),
    ).toBe("/governance/policy-packs?reviewId=run-123&packAId=pack-a&packBId=pack-b");
  });

  it("builds compare handoff from baseline and target pack ids", () => {
    expect(
      buildPolicyPacksImpactPreviewHref(
        resolveCompareGovernancePackImpactHandoff("run-target", "pack-a", "pack-b"),
      ),
    ).toBe("/governance/policy-packs?reviewId=run-target&packAId=pack-a&packBId=pack-b");
  });
});

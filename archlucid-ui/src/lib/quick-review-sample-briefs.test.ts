import { describe, expect, it } from "vitest";

import {
  defaultQuickReviewSampleBriefId,
  findQuickReviewSampleBrief,
  QUICK_REVIEW_SAMPLE_BRIEFS,
} from "@/lib/quick-review-sample-briefs";

describe("quick-review-sample-briefs", () => {
  it("includes five vertical briefs", () => {
    expect(QUICK_REVIEW_SAMPLE_BRIEFS).toHaveLength(5);
  });

  it("defaults to healthcare in demo mode or when CTO tour is active", () => {
    expect(defaultQuickReviewSampleBriefId(true)).toBe("healthcare");
    expect(defaultQuickReviewSampleBriefId(false, true)).toBe("healthcare");
    expect(defaultQuickReviewSampleBriefId(false, false)).toBe("retail");
  });

  it("loads healthcare brief text", () => {
    const brief = findQuickReviewSampleBrief("healthcare");

    expect(brief).not.toBeNull();
    expect(brief?.brief.length).toBeGreaterThan(100);
    expect(brief?.brief).toContain("Northstar Health");
  });
});

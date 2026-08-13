import { describe, expect, it } from "vitest";

import {
  isReviewGuideRequiredStatusLabel,
  mapReviewGuideRequiredStatusToTagKind,
} from "@/lib/review-guide-help-required-status";

describe("review-guide-help-required-status", () => {
  it("recognizes canonical Required column labels", () => {
    expect(isReviewGuideRequiredStatusLabel("Required")).toBe(true);
    expect(isReviewGuideRequiredStatusLabel("Conditional")).toBe(true);
    expect(isReviewGuideRequiredStatusLabel("Optional")).toBe(true);
    expect(isReviewGuideRequiredStatusLabel("Not applicable")).toBe(true);
    expect(isReviewGuideRequiredStatusLabel("Required without context")).toBe(false);
    expect(isReviewGuideRequiredStatusLabel("—")).toBe(false);
  });

  it("maps labels to StatusTag kinds", () => {
    expect(mapReviewGuideRequiredStatusToTagKind("Required")).toBe("needs-attention");
    expect(mapReviewGuideRequiredStatusToTagKind("Conditional")).toBe("in-progress");
    expect(mapReviewGuideRequiredStatusToTagKind("Optional")).toBe("draft");
    expect(mapReviewGuideRequiredStatusToTagKind("Not applicable")).toBe("neutral");
  });
});

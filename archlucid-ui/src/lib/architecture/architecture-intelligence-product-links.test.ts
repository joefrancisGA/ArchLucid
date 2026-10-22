import { describe, expect, it } from "vitest";

import { buildArchitectureIntelligenceProductLinks } from "@/lib/architecture/architecture-intelligence-product-links";
import {
  architectureIntelligenceReviewTierLabel,
  isArchitectureIntelligenceReviewTier,
} from "@/lib/architecture/architecture-intelligence-review-tier";

describe("buildArchitectureIntelligenceProductLinks", () => {
  it("returns null for empty runId", () => {
    expect(buildArchitectureIntelligenceProductLinks(null)).toBeNull();
    expect(buildArchitectureIntelligenceProductLinks("  ")).toBeNull();
  });

  it("builds review, findings, and advisory deep links", () => {
    expect(buildArchitectureIntelligenceProductLinks("run-abc")).toEqual({
      reviewHref: "/architecture/reviews/run-abc",
      findingsHref: "/governance/findings?runId=run-abc",
      advisoryHref: "/governance/advisory-scans?runId=run-abc",
    });
  });
});

describe("architectureIntelligenceReviewTier", () => {
  it("narrows valid tiers", () => {
    expect(isArchitectureIntelligenceReviewTier("Standard")).toBe(true);
    expect(isArchitectureIntelligenceReviewTier("Economy")).toBe(false);
  });

  it("labels each tier", () => {
    expect(architectureIntelligenceReviewTierLabel("Trial")).toContain("lowest");
    expect(architectureIntelligenceReviewTierLabel("Standard")).toBe("Balanced (recommended)");
    expect(architectureIntelligenceReviewTierLabel("Deep")).toContain("highest");
  });
});

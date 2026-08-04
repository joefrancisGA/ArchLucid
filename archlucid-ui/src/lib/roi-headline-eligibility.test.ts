import { describe, expect, it } from "vitest";

import {
  resolveRoiHeadlineEligibility,
  roiHeadlineIllustrativeLabel,
  shouldSuppressRoiHeadlineForSponsor,
  ROI_HEADLINE_ILLUSTRATIVE_DEMO_LABEL,
  type RoiHeadlineBasis,
} from "@/lib/roi-headline-eligibility";

const ALL_BASES: readonly RoiHeadlineBasis[] = [
  "buyer-provided",
  "uploaded-actual-amortized",
  "azure-retail",
  "heuristic-fallback",
  "demo-derived",
  "missing",
  "estimate",
] as const;

describe("resolveRoiHeadlineEligibility", () => {
  it("never maps demo-derived to headline-eligible", () => {
    expect(resolveRoiHeadlineEligibility("demo-derived")).toBe("illustrative-only");
    expect(shouldSuppressRoiHeadlineForSponsor("demo-derived")).toBe(true);
    expect(roiHeadlineIllustrativeLabel("demo-derived")).toBe(ROI_HEADLINE_ILLUSTRATIVE_DEMO_LABEL);
  });

  it("allows buyer-provided and uploaded actual as headlines", () => {
    expect(resolveRoiHeadlineEligibility("buyer-provided")).toBe("headline-eligible");
    expect(resolveRoiHeadlineEligibility("uploaded-actual-amortized")).toBe("headline-eligible");
    expect(shouldSuppressRoiHeadlineForSponsor("buyer-provided")).toBe(false);
  });

  it("treats estimate and heuristic as illustrative-only", () => {
    expect(resolveRoiHeadlineEligibility("estimate")).toBe("illustrative-only");
    expect(resolveRoiHeadlineEligibility("heuristic-fallback")).toBe("illustrative-only");
    expect(resolveRoiHeadlineEligibility("azure-retail")).toBe("illustrative-only");
  });

  it("suppresses missing basis with a CTA path", () => {
    expect(resolveRoiHeadlineEligibility("missing")).toBe("suppressed-with-cta");
  });

  it("covers every known basis", () => {
    for (const basis of ALL_BASES) {
      expect(resolveRoiHeadlineEligibility(basis).length).toBeGreaterThan(0);
    }
  });
});

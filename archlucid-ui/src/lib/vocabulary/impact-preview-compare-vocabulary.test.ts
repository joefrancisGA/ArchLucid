import { describe, expect, it } from "vitest";

import {
  IMPACT_PREVIEW_COMPARE_COMPARE_LINK,
  IMPACT_PREVIEW_COMPARE_COMPACT_LINE,
  IMPACT_PREVIEW_COMPARE_HEADING,
  IMPACT_PREVIEW_COMPARE_IMPACT_PREVIEW_LINK,
  IMPACT_PREVIEW_COMPARE_WHY_TWO,
  buildImpactPreviewCompareVocabulary,
  resolveImpactPreviewComparePeerLink,
} from "@/lib/vocabulary/impact-preview-compare-vocabulary";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";

describe("impact-preview-compare-vocabulary (TB-2250)", () => {
  it("explains why impact preview and compare stay separate and deep-links both", () => {
    const model = buildImpactPreviewCompareVocabulary();

    expect(model.heading).toBe(IMPACT_PREVIEW_COMPARE_HEADING);
    expect(model.heading.toLowerCase()).toContain("impact preview");
    expect(model.whyTwo).toBe(IMPACT_PREVIEW_COMPARE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("simulate");
    expect(model.whyTwo.toLowerCase()).toContain("architecture package");
    expect(model.whyTwo.toLowerCase()).toContain("diff");
    expect(model.compactLine).toBe(IMPACT_PREVIEW_COMPARE_COMPACT_LINE);

    expect(model.impactPreviewLink).toEqual(IMPACT_PREVIEW_COMPARE_IMPACT_PREVIEW_LINK);
    expect(model.impactPreviewLink.href).toBe(IMPACT_PREVIEW_PATH);
    expect(model.impactPreviewLink.href).toBe("/insights/impact-preview");

    expect(model.compareLink).toEqual(IMPACT_PREVIEW_COMPARE_COMPARE_LINK);
    expect(model.compareLink.href).toBe(COMPARE_TWO_REVIEWS_PATH);
    expect(model.compareLink.href).toBe("/insights/compare-two-reviews");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveImpactPreviewComparePeerLink("impact-preview")).toEqual(
      IMPACT_PREVIEW_COMPARE_COMPARE_LINK,
    );
    expect(resolveImpactPreviewComparePeerLink("compare")).toEqual(
      IMPACT_PREVIEW_COMPARE_IMPACT_PREVIEW_LINK,
    );
  });

  it("stays distinct from validate-compare paths (TB-2240)", () => {
    const model = buildImpactPreviewCompareVocabulary();

    expect(model.impactPreviewLink.href).not.toContain("replay");
    expect(model.compareLink.href).toBe(COMPARE_TWO_REVIEWS_PATH);
  });
});

import { describe, expect, it } from "vitest";

import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import { REPLAY_CANONICAL_PATH } from "@/lib/replay-evidence-copy";
import {
  VALIDATE_COMPARE_COMPARE_LINK,
  VALIDATE_COMPARE_COMPACT_LINE,
  VALIDATE_COMPARE_HEADING,
  VALIDATE_COMPARE_VALIDATE_LINK,
  VALIDATE_COMPARE_WHY_TWO,
  buildValidateCompareVocabulary,
  resolveValidateComparePeerLink,
} from "@/lib/vocabulary/validate-compare-vocabulary";

describe("validate-compare-vocabulary (TB-2240)", () => {
  it("explains why validate and compare stay separate and deep-links both", () => {
    const model = buildValidateCompareVocabulary();

    expect(model.heading).toBe(VALIDATE_COMPARE_HEADING);
    expect(model.whyTwo).toBe(VALIDATE_COMPARE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("validate");
    expect(model.whyTwo.toLowerCase()).toContain("compare");
    expect(model.whyTwo.toLowerCase()).toContain("architecture package");
    expect(model.compactLine).toBe(VALIDATE_COMPARE_COMPACT_LINE);

    expect(model.validateLink).toEqual(VALIDATE_COMPARE_VALIDATE_LINK);
    expect(model.validateLink.href).toBe(INTERNAL_REPLAY_PATH);
    expect(model.validateLink.href).toBe(REPLAY_CANONICAL_PATH);
    expect(model.validateLink.href).toBe("/internal/replay");

    expect(model.compareLink).toEqual(VALIDATE_COMPARE_COMPARE_LINK);
    expect(model.compareLink.href).toBe(COMPARE_TWO_REVIEWS_PATH);
    expect(model.compareLink.href).toBe("/insights/compare-two-reviews");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveValidateComparePeerLink("validate-replay")).toEqual(VALIDATE_COMPARE_COMPARE_LINK);
    expect(resolveValidateComparePeerLink("compare")).toEqual(VALIDATE_COMPARE_VALIDATE_LINK);
  });
});

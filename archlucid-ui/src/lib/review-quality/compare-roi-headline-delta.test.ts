import { describe, expect, it } from "vitest";

import {
  buildCompareRoiHeadlineDeltaView,
  COMPARE_ROI_SAVINGS_NOT_RETURNED_LABEL,
} from "@/lib/review-quality/compare-roi-headline-delta";

describe("buildCompareRoiHeadlineDeltaView", () => {
  it("returns null when both runs lack savings", () => {
    expect(
      buildCompareRoiHeadlineDeltaView({
        baselineSavings: null,
        targetSavings: null,
      }),
    ).toBeNull();
  });

  it("labels omitted savings payloads as not returned", () => {
    const view = buildCompareRoiHeadlineDeltaView({
      baselineSavings: null,
      targetSavings: {
        annualizedUsd: 2400,
        basisFootnotes: [],
        sourceKind: "server-findings",
      },
    });

    expect(view?.baseline.savingsLabel).toBe(COMPARE_ROI_SAVINGS_NOT_RETURNED_LABEL);
    expect(view?.target.savingsLabel).toBe("$2,400");
  });

  it("formats baseline and target savings with non-summing honesty", () => {
    const view = buildCompareRoiHeadlineDeltaView({
      baselineSavings: {
        annualizedUsd: 1200,
        basisFootnotes: ["Disposition-aware open findings."],
        sourceKind: "server-findings",
      },
      targetSavings: {
        annualizedUsd: 2400,
        basisFootnotes: ["Disposition-aware open findings."],
        sourceKind: "server-findings",
      },
    });

    expect(view?.baseline.savingsLabel).toBe("$1,200");
    expect(view?.target.savingsLabel).toBe("$2,400");
    expect(view?.nonSummingLine).toContain("do not sum to the headline");
  });
});

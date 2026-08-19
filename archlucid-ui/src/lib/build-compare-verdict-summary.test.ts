import { describe, expect, it } from "vitest";

import { buildCompareComparisonTrustItems } from "@/lib/build-compare-comparison-trust-items";
import { buildCompareVerdictSummary } from "@/lib/build-compare-verdict-summary";
import type { GoldenManifestComparison } from "@/types/comparison";

const sampleGolden: GoldenManifestComparison = {
  baseRunId: "a",
  targetRunId: "b",
  decisionChanges: [{ decisionKey: "k", baseValue: "1", targetValue: "2", changeType: "Modified" }],
  requirementChanges: [{ requirementName: "req", changeType: "Added" }],
  securityChanges: [],
  topologyChanges: [],
  costChanges: [],
  summaryHighlights: ["Leadership note"],
};

describe("buildCompareVerdictSummary", () => {
  it("counts non-zero categories only", () => {
    const summary = buildCompareVerdictSummary(sampleGolden);

    expect(summary.totalChanges).toBe(2);
    expect(summary.categoryCounts.map((row) => row.key)).toEqual(["decisions", "requirements"]);
    expect(summary.topChangeHighlight?.text).toBe("Leadership note");
    expect(summary.summaryHighlightsForFold).toEqual([]);
  });
});

describe("buildCompareComparisonTrustItems", () => {
  it("orders execution-mode caveats ahead of governance and AI notes", () => {
    const items = buildCompareComparisonTrustItems({
      executionModeHonesty: {
        baselineMode: "Synthetic",
        updatedMode: "Real",
        modesDiffer: true,
        anyNonReal: true,
        advisoryParagraph: "Modes differ advisory.",
        modeUnavailable: false,
      },
      usesCurrentEffectiveOnly: true,
      hasAiNarrative: true,
    });

    expect(items[0]?.id).toBe("execution-mode");
    expect(items.some((item) => item.id === "governance-current-effective")).toBe(true);
    expect(items.some((item) => item.id === "ai-advisory")).toBe(true);
  });
});

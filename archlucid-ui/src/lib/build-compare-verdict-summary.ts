import { applyBuyerPolishedGoldenManifestSummaryHighlights } from "@/lib/buyer/buyer-golden-manifest-summary-highlights";
import { sortGoldenManifestComparison } from "@/lib/compare-display-sort";
import { ARCHITECTURE_STRUCTURE_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";
import type { GoldenManifestComparison } from "@/types/comparison";

export type CompareVerdictCategoryCount = {
  readonly key: string;
  readonly label: string;
  readonly count: number;
};

export type CompareTopChangeHighlight = {
  readonly text: string;
  readonly source: "deterministic" | "model";
  readonly supportingSectionId: string;
};

export type CompareVerdictSummaryModel = {
  readonly totalChanges: number;
  readonly categoryCounts: readonly CompareVerdictCategoryCount[];
  readonly topChangeHighlight: CompareTopChangeHighlight | null;
  readonly summaryHighlightsForFold: readonly string[];
  readonly baselineRunId: string;
  readonly targetRunId: string;
};

export function buildCompareVerdictSummary(golden: GoldenManifestComparison): CompareVerdictSummaryModel {
  const sorted = sortGoldenManifestComparison(golden);
  const summaryHighlights = applyBuyerPolishedGoldenManifestSummaryHighlights(sorted.summaryHighlights);
  const total =
    sorted.totalDeltaCount !== undefined
      ? sorted.totalDeltaCount
      : sorted.decisionChanges.length +
        sorted.requirementChanges.length +
        sorted.securityChanges.length +
        sorted.topologyChanges.length +
        sorted.costChanges.length;

  const categoryCounts: CompareVerdictCategoryCount[] = [
    { key: "decisions", label: "Decisions", count: sorted.decisionChanges.length },
    { key: "requirements", label: "Requirements", count: sorted.requirementChanges.length },
    { key: "findings", label: "Findings / posture", count: sorted.securityChanges.length },
    { key: "topology", label: ARCHITECTURE_STRUCTURE_BUYER_LABEL, count: sorted.topologyChanges.length },
    { key: "cost", label: "Cost", count: sorted.costChanges.length },
  ].filter((row) => row.count > 0);

  const firstHighlight = summaryHighlights.length > 0 ? summaryHighlights[0] : null;

  return {
    totalChanges: total,
    categoryCounts,
    topChangeHighlight:
      firstHighlight !== null
        ? {
            text: firstHighlight,
            source: "deterministic",
            supportingSectionId: "compare-structured",
          }
        : null,
    summaryHighlightsForFold: summaryHighlights.slice(1),
    baselineRunId: sorted.baseRunId,
    targetRunId: sorted.targetRunId,
  };
}

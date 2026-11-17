import { resolveScopedInsightOpenReviewHrefWithDeskContinuity } from "@/lib/insights/scoped-insight-open-review-href";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { findingsPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";

export type ArchitectureIntelligenceProductLinks = {
  readonly reviewHref: string;
  readonly findingsHref: string;
  readonly advisoryHref: string;
};

/** Product surfaces to open after ArchitectureIntelligence publish for a run. */
export function buildArchitectureIntelligenceProductLinks(
  runId: string | null | undefined,
  productLine: ProductLineId = "architecture",
): ArchitectureIntelligenceProductLinks | null {
  const trimmed = runId?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  const encoded = encodeURIComponent(trimmed);

  const findingsBasePath = findingsPathForProductLine(productLine);

  return {
    reviewHref: resolveScopedInsightOpenReviewHrefWithDeskContinuity(trimmed),
    findingsHref: `${findingsBasePath}?runId=${encoded}`,
    advisoryHref: `/governance/advisory-scans?runId=${encoded}`,
  };
}

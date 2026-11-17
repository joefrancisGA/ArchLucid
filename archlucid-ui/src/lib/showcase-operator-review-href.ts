import { resolveAskBuyerOpenReviewHref } from "@/lib/ask-buyer-grounding-links";
import { resolveScopedInsightOpenReviewHrefWithDeskContinuity } from "@/lib/insights/scoped-insight-open-review-href";

/** Showcase quick-nav when anonymous visitor deep links are allowed (static demo run). */
export function resolveShowcaseOperatorReviewHref(runId: string): string {
  return resolveScopedInsightOpenReviewHrefWithDeskContinuity(runId.trim());
}

export function resolveShowcaseOperatorFindingHref(runId: string, findingId: string): string {
  return resolveAskBuyerOpenReviewHref(runId.trim(), {
    primaryFindingId: findingId.trim(),
  });
}

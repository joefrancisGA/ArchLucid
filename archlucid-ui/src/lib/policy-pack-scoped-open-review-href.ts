import { resolveScopedInsightOpenReviewHrefWithDeskContinuity } from "@/lib/insights/scoped-insight-open-review-href";

/** Policy-pack scoped banners — desk continuity when architecture is not pinned on the page. */
export function resolvePolicyPackScopedOpenReviewHref(scopedReviewId: string): string {
  return resolveScopedInsightOpenReviewHrefWithDeskContinuity(scopedReviewId);
}

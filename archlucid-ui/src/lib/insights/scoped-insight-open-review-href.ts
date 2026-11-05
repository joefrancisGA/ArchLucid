import { resolveAskBuyerOpenReviewHref } from "@/lib/ask-buyer-grounding-links";
import { resolveSystemNotJobWorkingReviewOpenHref } from "@/lib/system-not-job-nested-review-job-mint";

export type ScopedInsightOpenReviewHrefOptions = {
  readonly primaryFindingId?: string | null;
  readonly architectureId?: string | null;
};

/** Scoped insight banners: findings workspace when cited, else working-mode review open when architecture is known. */
export function resolveScopedInsightOpenReviewHref(
  runId: string,
  options?: ScopedInsightOpenReviewHrefOptions,
): string {
  const findingId = options?.primaryFindingId?.trim() ?? "";

  if (findingId.length > 0) {
    return resolveAskBuyerOpenReviewHref(runId, { primaryFindingId: findingId });
  }

  return resolveSystemNotJobWorkingReviewOpenHref(runId.trim(), options?.architectureId ?? null);
}

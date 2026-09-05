import { askReviewQuestionsHref, ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { buildCompareTwoReviewsHref, COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { evidenceGraphHref, EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { resolveOpenPackageRunId } from "@/lib/resolve-open-package-run-id";

export type ResolveWorkingInsightsNavHrefInput = {
  readonly href: string;
  readonly pathname: string | null | undefined;
  readonly lastOpenReviewId?: string | null;
};

/** Working sidebar/palette links: scope Ask, Compare, and graph to the open package (LS-05). */
export function resolveWorkingInsightsNavHref(input: ResolveWorkingInsightsNavHrefInput): string {
  const openPackageRunId = resolveOpenPackageRunId({
    pathname: input.pathname,
    lastOpenReviewId: input.lastOpenReviewId,
  });

  if (openPackageRunId === null) {
    return input.href;
  }

  if (input.href === ASK_REVIEW_QUESTIONS_PATH || input.href.startsWith(`${ASK_REVIEW_QUESTIONS_PATH}/`)) {
    return askReviewQuestionsHref({ runId: openPackageRunId });
  }

  if (input.href === COMPARE_TWO_REVIEWS_PATH || input.href.startsWith(`${COMPARE_TWO_REVIEWS_PATH}/`)) {
    return buildCompareTwoReviewsHref({ baseRunId: openPackageRunId });
  }

  if (input.href === EVIDENCE_GRAPH_PATH || input.href.startsWith(`${EVIDENCE_GRAPH_PATH}/`)) {
    return evidenceGraphHref({ runId: openPackageRunId });
  }

  return input.href;
}

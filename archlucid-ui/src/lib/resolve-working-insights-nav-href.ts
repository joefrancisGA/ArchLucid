import { askReviewQuestionsHref, ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { compareTwoReviewsHref, buildCompareTwoReviewsHref, COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { evidenceGraphHref, EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { resolveOpenPackageRunId } from "@/lib/resolve-open-package-run-id";

export type ResolveWorkingInsightsNavHrefInput = {
  readonly href: string;
  readonly pathname: string | null | undefined;
  readonly lastOpenReviewId?: string | null;
  readonly lastOpenArchitectureId?: string | null;
};

/** Working sidebar/palette links: scope Ask, Compare, and graph to the open package (LS-05 / AO-29–31). */
export function resolveWorkingInsightsNavHref(input: ResolveWorkingInsightsNavHrefInput): string {
  const openPackageRunId = resolveOpenPackageRunId({
    pathname: input.pathname,
    lastOpenReviewId: input.lastOpenReviewId,
  });
  const architectureId = input.lastOpenArchitectureId?.trim() ?? "";

  if (input.href === ASK_REVIEW_QUESTIONS_PATH || input.href.startsWith(`${ASK_REVIEW_QUESTIONS_PATH}/`)) {
    if (openPackageRunId !== null) {
      return askReviewQuestionsHref({ runId: openPackageRunId });
    }

    return input.href;
  }

  if (input.href === COMPARE_TWO_REVIEWS_PATH || input.href.startsWith(`${COMPARE_TWO_REVIEWS_PATH}/`)) {
    if (openPackageRunId !== null) {
      return buildCompareTwoReviewsHref({
        baseRunId: openPackageRunId,
        ...(architectureId.length > 0 ? { architectureId } : {}),
      });
    }

    if (architectureId.length > 0) {
      return compareTwoReviewsHref({ architectureId });
    }

    return input.href;
  }

  if (input.href === EVIDENCE_GRAPH_PATH || input.href.startsWith(`${EVIDENCE_GRAPH_PATH}/`)) {
    if (openPackageRunId !== null) {
      return evidenceGraphHref({ runId: openPackageRunId });
    }

    return input.href;
  }

  return input.href;
}

import { askReviewQuestionsHref, ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import {
  architectureNestedAskPath,
  architectureNestedComparePath,
  architectureNestedFindingsPath,
  architectureNestedGraphPath,
} from "@/lib/architecture/architecture-routes";
import { compareTwoReviewsHref, buildCompareTwoReviewsHref, COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { evidenceGraphHref, EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { governanceFindingsArchitectureScopeHrefFromSearch } from "@/lib/governance/governance-findings-architecture-scope";
import { resolveOpenPackageRunId } from "@/lib/resolve-open-package-run-id";

export type ResolveWorkingInsightsNavHrefInput = {
  readonly href: string;
  readonly pathname: string | null | undefined;
  readonly lastOpenReviewId?: string | null;
  readonly lastOpenArchitectureId?: string | null;
};

/** Working sidebar/palette links: scope Ask, Compare, graph, and findings to the architecture desk (SY-45 / ADR 0079). */
export function resolveWorkingInsightsNavHref(input: ResolveWorkingInsightsNavHrefInput): string {
  const openPackageRunId = resolveOpenPackageRunId({
    pathname: input.pathname,
    lastOpenReviewId: input.lastOpenReviewId,
  });
  const architectureId = input.lastOpenArchitectureId?.trim() ?? "";

  if (input.href === ASK_REVIEW_QUESTIONS_PATH || input.href.startsWith(`${ASK_REVIEW_QUESTIONS_PATH}/`)) {
    if (architectureId.length > 0) {
      if (openPackageRunId !== null) {
        return `${architectureNestedAskPath(architectureId)}?runId=${encodeURIComponent(openPackageRunId)}`;
      }

      return architectureNestedAskPath(architectureId);
    }

    if (openPackageRunId !== null) {
      return askReviewQuestionsHref({ runId: openPackageRunId });
    }

    return input.href;
  }

  if (input.href === COMPARE_TWO_REVIEWS_PATH || input.href.startsWith(`${COMPARE_TWO_REVIEWS_PATH}/`)) {
    if (architectureId.length > 0) {
      if (openPackageRunId !== null) {
        const peerScoped = buildCompareTwoReviewsHref({
          baseRunId: openPackageRunId,
          architectureId,
        });
        const queryIndex = peerScoped.indexOf("?");

        if (queryIndex >= 0) {
          return `${architectureNestedComparePath(architectureId)}${peerScoped.slice(queryIndex)}`;
        }

        return architectureNestedComparePath(architectureId);
      }

      return architectureNestedComparePath(architectureId);
    }

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
    if (architectureId.length > 0) {
      if (openPackageRunId !== null) {
        return `${architectureNestedGraphPath(architectureId)}?runId=${encodeURIComponent(openPackageRunId)}`;
      }

      return architectureNestedGraphPath(architectureId);
    }

    if (openPackageRunId !== null) {
      return evidenceGraphHref({ runId: openPackageRunId });
    }

    return input.href;
  }

  if (input.href === GOVERNANCE_FINDINGS_PATH || input.href.startsWith(`${GOVERNANCE_FINDINGS_PATH}/`)) {
    if (architectureId.length > 0) {
      return governanceFindingsArchitectureScopeHrefFromSearch(
        "",
        architectureId,
        architectureNestedFindingsPath(architectureId),
      );
    }

    return input.href;
  }

  return input.href;
}

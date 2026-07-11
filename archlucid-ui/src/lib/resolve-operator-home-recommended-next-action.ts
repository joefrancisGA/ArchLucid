import {
  OPERATOR_HOME_RECOMMENDED_NEXT_CREATE_OR_REVIEW,
  OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
  OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE,
  OPERATOR_HOME_RECOMMENDED_NEXT_START_REVIEW,
  OPERATOR_HOME_RECOMMENDED_NEXT_STATIC,
} from "@/lib/buyer-polish-copy";
import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

export type OperatorHomeRecommendedNextAction = {
  readonly message: string;
  readonly href: string | null;
};

/** Resolves compact recommended-next copy for the Overview hero from workspace signals. */
export function resolveOperatorHomeRecommendedNextAction(
  ctx: CorePilotCommitContext | undefined,
  hasCommittedArchitectureReview: boolean,
): OperatorHomeRecommendedNextAction {
  if (hasCommittedArchitectureReview && ctx?.latestRunId !== null && ctx?.latestRunId !== undefined) {
    return {
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
      href: `/reviews/${ctx.latestRunId}`,
    };
  }

  if (ctx === undefined) {
    return {
      message: OPERATOR_HOME_RECOMMENDED_NEXT_STATIC,
      href: null,
    };
  }

  if (ctx.latestRunId !== null) {
    return {
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
      href: `/reviews/${ctx.latestRunId}`,
    };
  }

  if (ctx.latestRunReadyToFinalize) {
    return {
      message: OPERATOR_HOME_RECOMMENDED_NEXT_START_REVIEW,
      href: "/reviews/new",
    };
  }

  if (ctx.hasCommittedManifest && ctx.firstCommittedRunId !== null) {
    return {
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
      href: `/reviews/${ctx.firstCommittedRunId}`,
    };
  }

  if (ctx.committedReviewCount === 0) {
    return {
      message: OPERATOR_HOME_RECOMMENDED_NEXT_CREATE_OR_REVIEW,
      href: null,
    };
  }

  return {
    message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE,
    href: showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
  };
}

/** Static fallback when commit context is still loading on first-run Overview. */
export function resolveOperatorHomeRecommendedNextFallback(): OperatorHomeRecommendedNextAction {
  return {
    message: OPERATOR_HOME_RECOMMENDED_NEXT_STATIC,
    href: null,
  };
}

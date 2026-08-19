import {
  OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
  OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE,
  OPERATOR_HOME_RECOMMENDED_NEXT_START_REVIEW,
} from "@/lib/buyer/buyer-polish-copy";
import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

export type OperatorHomeRecommendedNextAction = {
  readonly message: string;
  readonly href: string | null;
};

function resolveOperatorHomeSampleFirstAction(): OperatorHomeRecommendedNextAction {
  return {
    message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE,
    href: showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
  };
}

/** Resolves compact recommended-next copy for the Overview hero from workspace signals. */
export function resolveOperatorHomeRecommendedNextAction(
  ctx: CorePilotCommitContext | undefined,
  hasCommittedArchitectureReview: boolean,
): OperatorHomeRecommendedNextAction {
  if (hasCommittedArchitectureReview && ctx?.latestRunId !== null && ctx?.latestRunId !== undefined) {
    return {
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
      href: `/architecture/reviews/${ctx.latestRunId}`,
    };
  }

  if (ctx === undefined) {
    return resolveOperatorHomeSampleFirstAction();
  }

  if (ctx.latestRunId !== null) {
    return {
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
      href: `/architecture/reviews/${ctx.latestRunId}`,
    };
  }

  if (ctx.latestRunReadyToFinalize) {
    return {
      message: OPERATOR_HOME_RECOMMENDED_NEXT_START_REVIEW,
      href: "/architecture/reviews/new",
    };
  }

  if (ctx.hasCommittedManifest && ctx.firstCommittedRunId !== null) {
    return {
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
      href: `/architecture/reviews/${ctx.firstCommittedRunId}`,
    };
  }

  if (ctx.committedReviewCount === 0) {
    return resolveOperatorHomeSampleFirstAction();
  }

  return {
    message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE,
    href: showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
  };
}

/** Static fallback when commit context is still loading on first-run Overview. */
export function resolveOperatorHomeRecommendedNextFallback(): OperatorHomeRecommendedNextAction {
  return resolveOperatorHomeSampleFirstAction();
}

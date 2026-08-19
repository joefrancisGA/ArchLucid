import { describe, expect, it } from "vitest";

import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import {
  OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE,
  OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
} from "@/lib/buyer/buyer-polish-copy";
import {
  resolveOperatorHomeRecommendedNextAction,
  resolveOperatorHomeRecommendedNextFallback,
} from "@/lib/resolve-operator-home-recommended-next-action";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

const emptyContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

describe("resolveOperatorHomeRecommendedNextAction", () => {
  it("returns sample-first guidance when context is undefined", () => {
    expect(resolveOperatorHomeRecommendedNextAction(undefined, false)).toEqual({
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE,
      href: showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    });
  });

  it("suggests the completed sample when the workspace has no packages", () => {
    expect(resolveOperatorHomeRecommendedNextAction(emptyContext, false)).toEqual({
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE,
      href: showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    });
  });

  it("opens the latest package when a run exists", () => {
    const context: CorePilotCommitContext = {
      ...emptyContext,
      latestRunId: "run-42",
    };

    expect(resolveOperatorHomeRecommendedNextAction(context, false)).toEqual({
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
      href: "/architecture/reviews/run-42",
    });
  });

  it("opens the latest package after first commit", () => {
    const context: CorePilotCommitContext = {
      ...emptyContext,
      hasCommittedManifest: true,
      latestRunId: "run-committed",
      firstCommittedRunId: "run-committed",
      committedReviewCount: 1,
    };

    expect(resolveOperatorHomeRecommendedNextAction(context, true)).toEqual({
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
      href: "/architecture/reviews/run-committed",
    });
  });

  it("falls back to the completed sample when only committed count is non-zero", () => {
    const context: CorePilotCommitContext = {
      ...emptyContext,
      committedReviewCount: 1,
      hasCommittedManifest: true,
      firstCommittedRunId: "run-1",
    };

    expect(resolveOperatorHomeRecommendedNextAction(context, false)).toEqual({
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_LATEST,
      href: "/architecture/reviews/run-1",
    });
  });

  it("exposes a sample-first loading fallback", () => {
    expect(resolveOperatorHomeRecommendedNextFallback()).toEqual({
      message: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE,
      href: showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    });
  });

  it("can link to the showcase sample when no stronger signal exists", () => {
    const context: CorePilotCommitContext = {
      ...emptyContext,
      committedReviewCount: 2,
      hasCommittedManifest: true,
    };

    expect(resolveOperatorHomeRecommendedNextAction(context, false).href).toBe(
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
  });
});

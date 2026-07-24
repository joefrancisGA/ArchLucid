import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { deriveCorePilotCommitProgressState } from "@/lib/core-pilot-commit-progress";
import {
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
} from "@/lib/buyer-polish-copy";
import {
  BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR,
  FIRST_WEEK_ROUTE_GUIDANCE,
} from "@/lib/first-week-route-guidance";
import { OPERATOR_START_REVIEW_QUICK_ACTION_LABEL } from "@/lib/operator-nav-labels";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

export type PilotNextBestAction = {
  readonly label: string;
  readonly href: string;
  readonly bridgeCopy: string;
};

/** Resolves the single primary CTA for operator Overview from Core Pilot commit signals. */
export function resolvePilotNextBestAction(
  ctx: CorePilotCommitContext,
  hasCommittedArchitectureReview: boolean,
): PilotNextBestAction {
  const committed = hasCommittedArchitectureReview || ctx.hasCommittedManifest;

  if (committed) {
    return {
      label: "Review open findings",
      href: "/governance/findings?filter=open",
      bridgeCopy:
        "Triage material findings from your finalized architecture reviews — the fastest path from Overview to action.",
    };
  }

  const pilotState = deriveCorePilotCommitProgressState(ctx.hasCommittedManifest, ctx.latestRunId);

  if (pilotState === "no-run") {
    return {
      label: OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
      href: showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
      bridgeCopy: PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
    };
  }

  if (ctx.latestRunReadyToFinalize && ctx.latestRunId !== null) {
    return {
      label: "Finalize this review",
      href: `/reviews/${ctx.latestRunId}${BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR}`,
      bridgeCopy: FIRST_WEEK_ROUTE_GUIDANCE["review-detail-in-progress"].bridgeCopy,
    };
  }

  if (ctx.latestRunId !== null) {
    return {
      label: "Continue review",
      href: `/reviews/${ctx.latestRunId}`,
      bridgeCopy:
        "Open your in-progress review — complete findings review and finalize when ready.",
    };
  }

  return {
    label: OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
    href: "/reviews/new",
    bridgeCopy: FIRST_WEEK_ROUTE_GUIDANCE.home.bridgeCopy,
  };
}

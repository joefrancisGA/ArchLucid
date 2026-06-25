import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { deriveCorePilotCommitProgressState } from "@/lib/core-pilot-commit-progress";
import {
  BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR,
  FIRST_WEEK_ROUTE_GUIDANCE,
} from "@/lib/first-week-route-guidance";
import { OPERATOR_START_REVIEW_QUICK_ACTION_LABEL } from "@/lib/operator-nav-labels";

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
      label: "View executive summary",
      href: "/dashboard",
      bridgeCopy:
        FIRST_WEEK_ROUTE_GUIDANCE["review-detail-committed"].bridgeCopy,
    };
  }

  const pilotState = deriveCorePilotCommitProgressState(ctx.hasCommittedManifest, ctx.latestRunId);

  if (pilotState === "no-run") {
    return {
      label: OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
      href: "/reviews/new",
      bridgeCopy: FIRST_WEEK_ROUTE_GUIDANCE.home.bridgeCopy,
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
        "Open your in-progress review package — complete findings review and finalize when ready.",
    };
  }

  return {
    label: OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
    href: "/reviews/new",
    bridgeCopy: FIRST_WEEK_ROUTE_GUIDANCE.home.bridgeCopy,
  };
}

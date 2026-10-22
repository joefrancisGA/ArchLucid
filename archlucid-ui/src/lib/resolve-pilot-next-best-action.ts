import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { deriveCorePilotCommitProgressState } from "@/lib/core-pilot-commit-progress";
import {
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
} from "@/lib/buyer/buyer-polish-copy";
import {
  BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR,
  FIRST_WEEK_ROUTE_GUIDANCE,
} from "@/lib/first-week-route-guidance";
import { OPERATOR_START_REVIEW_QUICK_ACTION_LABEL } from "@/lib/operator/operator-nav-labels";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

export type PilotNextBestAction = {
  readonly label: string;
  readonly href: string;
  readonly bridgeCopy: string;
};

/** Live Overview workspace counts used to gate findings vs start/sample CTAs (TB-1036). */
export type PilotNextBestActionWorkspaceSignals = {
  /** Sum of open findings across workspace reviews; treat missing as 0 (fail closed). */
  readonly openFindingsCount: number;
  /**
   * True when the workspace runs dashboard has at least one review package.
   * Authoritative for empty-state gating — commit-context alone must not invent occupancy.
   */
  readonly hasWorkspaceReviews: boolean;
};

const EMPTY_WORKSPACE_SIGNALS: PilotNextBestActionWorkspaceSignals = {
  openFindingsCount: 0,
  hasWorkspaceReviews: false,
};

function resolveEmptyWorkspaceAction(): PilotNextBestAction {
  return {
    label: OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
    href: showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    bridgeCopy: PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
  };
}

function resolveOpenFindingsAction(): PilotNextBestAction {
  return {
    label: "Review open findings",
    href: "/governance/findings?filter=open",
    bridgeCopy:
      "Prioritize material findings from your finalized architecture reviews — the fastest path from Home to action.",
  };
}

function resolveStartReviewAction(): PilotNextBestAction {
  return {
    label: OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
    href: "/architecture/reviews/new",
    bridgeCopy: FIRST_WEEK_ROUTE_GUIDANCE.home.bridgeCopy,
  };
}

/**
 * Resolves the single primary CTA for operator Overview from Core Pilot commit signals
 * and workspace review/findings counts (TB-1036).
 */
export function resolvePilotNextBestAction(
  ctx: CorePilotCommitContext,
  hasCommittedArchitectureReview: boolean,
  workspace: PilotNextBestActionWorkspaceSignals = EMPTY_WORKSPACE_SIGNALS,
): PilotNextBestAction {
  // Nav committed flag alone must not force the findings CTA (empty demo workspaces).
  void hasCommittedArchitectureReview;

  const openFindingsCount = Number.isFinite(workspace.openFindingsCount)
    ? Math.max(0, Math.trunc(workspace.openFindingsCount))
    : 0;

  // Empty Overview: Start/sample only — never lead with Review open findings.
  // Workspace occupancy is authoritative over commit-context (false committed signals).
  if (workspace.hasWorkspaceReviews !== true) {
    return resolveEmptyWorkspaceAction();
  }

  // Findings CTA only when there is something to triage.
  if (openFindingsCount > 0) {
    return resolveOpenFindingsAction();
  }

  const pilotState = deriveCorePilotCommitProgressState(ctx.hasCommittedManifest, ctx.latestRunId);

  if (pilotState === "no-run") {
    return resolveEmptyWorkspaceAction();
  }

  if (ctx.latestRunReadyToFinalize && ctx.latestRunId !== null) {
    return {
      label: "Finalize this review",
      href: `/architecture/reviews/${ctx.latestRunId}${BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR}`,
      bridgeCopy: FIRST_WEEK_ROUTE_GUIDANCE["review-detail-in-progress"].bridgeCopy,
    };
  }

  if (ctx.latestRunId !== null) {
    return {
      label: "Continue review",
      href: `/architecture/reviews/${ctx.latestRunId}`,
      bridgeCopy: "Open your in-progress review — complete findings review and finalize when ready.",
    };
  }

  // Committed-but-zero-open (or committed flag without a latest run id): start, not findings.
  return resolveStartReviewAction();
}

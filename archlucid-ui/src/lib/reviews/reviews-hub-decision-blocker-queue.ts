import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import {
  resolveReviewsHubDecisionSlaBadge,
  resolveReviewsHubWaitingOnKind,
  resolveReviewsHubWaitingOnLabel,
} from "@/lib/reviews/reviews-hub-decision-velocity-copy";
import type { RunSummary } from "@/types/authority";

export type ReviewsHubDecisionBlockerRow = {
  readonly runId: string;
  readonly reviewHref: string;
  readonly title: string;
  readonly slaBadge: string | null;
  readonly waitingOnLabel: string | null;
};

export const REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HEADING = "Reviews waiting on your decision" as const;

export const REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HELPER =
  "These rows need a finalize or approval step from you. Counts use tenant inventory only — not a compliance score." as const;

export function collectReviewsHubDecisionBlockers(
  runs: readonly RunSummary[],
  limit: number = 5,
): readonly ReviewsHubDecisionBlockerRow[] {
  const rows: ReviewsHubDecisionBlockerRow[] = [];

  for (const run of runs) {
    const waitingOn = resolveReviewsHubWaitingOnKind(run);
    if (waitingOn !== "you") {
      continue;
    }

    const runId = run.runId?.trim() ?? "";

    if (runId.length === 0) {
      continue;
    }

    rows.push({
      runId,
      reviewHref: reviewDetailPath(runId),
      title: buyerFacingReviewTitleFromSummary(run),
      slaBadge: resolveReviewsHubDecisionSlaBadge(run),
      waitingOnLabel: resolveReviewsHubWaitingOnLabel(waitingOn),
    });

    if (rows.length >= limit) {
      break;
    }
  }

  return rows;
}

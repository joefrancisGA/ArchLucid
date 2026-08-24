import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { detectStalledReview } from "@/lib/usability/stalled-review-detection";
import {
  buildUnfinishedWorkRailItems,
  type UnfinishedWorkRailItem,
  type UnfinishedWorkRailItemKind,
} from "@/lib/unfinished-work-rail";
import type { RunSummary } from "@/types/authority";

const CONTINUE_REVIEW_KINDS: ReadonlySet<UnfinishedWorkRailItemKind> = new Set([
  "review-in-progress",
  "awaiting-disposition",
]);

export type ReviewsHubContinueReviewCandidate = {
  readonly runId: string;
  readonly title: string;
  readonly href: string;
  readonly kind: UnfinishedWorkRailItemKind;
  readonly isStalled: boolean;
  readonly elapsedMinutes: number;
};

function toContinueReviewCandidate(item: UnfinishedWorkRailItem, runs: readonly RunSummary[]): ReviewsHubContinueReviewCandidate | null {
  const runId = item.id.split(":")[1]?.trim() ?? "";

  if (runId.length === 0) {
    return null;
  }

  const run = runs.find((candidate) => candidate.runId?.trim() === runId);
  const stallSignal = detectStalledReview(
    run?.createdUtc ?? null,
    run?.hasGoldenManifest === true,
    Date.now(),
    run?.isDeadLettered === true,
  );

  return {
    runId,
    title: item.title,
    href: item.href || reviewDetailPath(runId),
    kind: item.kind,
    isStalled: stallSignal.isStalled,
    elapsedMinutes: stallSignal.elapsedMinutes,
  };
}

/** Highest-priority in-flight or awaiting-disposition review for the reviews hub continue strip. */
export function resolveReviewsHubContinueReviewCandidate(
  runs: readonly RunSummary[],
): ReviewsHubContinueReviewCandidate | null {
  const railItem = buildUnfinishedWorkRailItems({ runs, drafts: [], incompleteWizards: [], maxItems: 6 }).find((item) =>
    CONTINUE_REVIEW_KINDS.has(item.kind),
  );

  if (railItem === undefined) {
    return null;
  }

  return toContinueReviewCandidate(railItem, runs);
}

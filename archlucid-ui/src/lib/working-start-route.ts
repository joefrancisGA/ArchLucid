import {
  ARCHITECTURES_NEW_PATH,
  architectureDraftPath,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";

export type ResolveWorkingStartHrefInput = {
  /** Active in-flight review run id (Pending/Running operation). */
  readonly inFlightReviewId?: string | null;
  /** Last-open review from server or recent-views cache. */
  readonly lastOpenReviewId?: string | null;
  /** Last-open draft architecture id (editor surface). */
  readonly lastOpenDraftId?: string | null;
  /**
   * When set, the draft spawned a review — Start must open the review, not the draft editor (spawn lock).
   */
  readonly spawnLockedReviewId?: string | null;
};

export type ResolveWorkingStartHrefResult = {
  readonly href: string;
  readonly reason: "in-flight-review" | "spawn-locked-review" | "last-open-review" | "last-open-draft" | "new-draft";
};

function trimmedId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

/** ADR 0069 / IS-03 — Working Start and Alt+N land on the current work object, not a chooser. */
export function resolveWorkingStartHref(input: ResolveWorkingStartHrefInput): ResolveWorkingStartHrefResult {
  const inFlightReviewId = trimmedId(input.inFlightReviewId);
  const lastOpenReviewId = trimmedId(input.lastOpenReviewId);
  const lastOpenDraftId = trimmedId(input.lastOpenDraftId);
  const spawnLockedReviewId = trimmedId(input.spawnLockedReviewId);

  if (inFlightReviewId !== null) {
    return {
      href: reviewDetailPath(inFlightReviewId),
      reason: "in-flight-review",
    };
  }

  if (spawnLockedReviewId !== null) {
    return {
      href: reviewDetailPath(spawnLockedReviewId),
      reason: "spawn-locked-review",
    };
  }

  if (lastOpenReviewId !== null) {
    return {
      href: reviewDetailPath(lastOpenReviewId),
      reason: "last-open-review",
    };
  }

  if (lastOpenDraftId !== null) {
    return {
      href: architectureDraftPath(lastOpenDraftId),
      reason: "last-open-draft",
    };
  }

  return {
    href: ARCHITECTURES_NEW_PATH,
    reason: "new-draft",
  };
}

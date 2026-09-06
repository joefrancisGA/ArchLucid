import {
  ARCHITECTURES_NEW_PATH,
  architectureIdentityPath,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";

export type ResolveWorkingStartHrefInput = {
  /** Active in-flight review run id (Pending/Running operation). */
  readonly inFlightReviewId?: string | null;
  /** Last-open durable architecture identity desk. */
  readonly lastOpenArchitectureId?: string | null;
  /**
   * When set, the draft spawned a review — Start must open the review, not the draft editor (spawn lock).
   */
  readonly spawnLockedReviewId?: string | null;
};

export type ResolveWorkingStartHrefResult = {
  readonly href: string;
  readonly reason:
    | "in-flight-review"
    | "spawn-locked-review"
    | "last-open-architecture"
    | "new-architecture";
};

function trimmedId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

/** ADR 0069 / IS-03 / CA-33 — Working Start and Alt+N land on the current work object, not a draft-as-identity URL. */
export function resolveWorkingStartHref(input: ResolveWorkingStartHrefInput): ResolveWorkingStartHrefResult {
  const inFlightReviewId = trimmedId(input.inFlightReviewId);
  const lastOpenArchitectureId = trimmedId(input.lastOpenArchitectureId);
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

  if (lastOpenArchitectureId !== null) {
    return {
      href: architectureIdentityPath(lastOpenArchitectureId),
      reason: "last-open-architecture",
    };
  }

  return {
    href: ARCHITECTURES_NEW_PATH,
    reason: "new-architecture",
  };
}

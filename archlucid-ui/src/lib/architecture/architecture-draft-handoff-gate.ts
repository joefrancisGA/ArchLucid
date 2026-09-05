import { ensureAppInsights } from "@/lib/telemetry";

const ACK_STORAGE_PREFIX = "archlucid.architecture_draft_handoff_ack.v1.";

export const ARCHITECTURE_DRAFT_HANDOFF_BANNER_LEAD =
  "This draft is a snapshot source for the linked review. Continue in the review for findings, evidence, and exports. Editing here does not update an in-flight or sealed package.";

export const ARCHITECTURE_DRAFT_HANDOFF_CANONICAL_REVIEW_LABEL =
  "The review is the canonical work surface after handoff.";

/** @deprecated RS-04 removed the post-spawn edit-anyway path; retained for telemetry label compatibility only. */
export const ARCHITECTURE_DRAFT_HANDOFF_ACKNOWLEDGE_LABEL =
  "Edit draft anyway — changes will not update the review";

type ArchitectureDraftSpawnedRunProbe = {
  readonly spawnedRunId?: string | null;
};

export function architectureDraftSpawnedRunId(
  draft: ArchitectureDraftSpawnedRunProbe | null | undefined,
): string | null {
  const spawnedRunId = draft?.spawnedRunId?.trim() ?? "";

  if (spawnedRunId.length === 0) {
    return null;
  }

  return spawnedRunId;
}

type LinkedReviewProbe = {
  readonly linkedReviewId?: string | null;
};

/** True when a draft registry row already spawned (or is linked to) a review run. */
export function architectureDraftHasLinkedReview(entry: LinkedReviewProbe | null | undefined): boolean {
  const linkedReviewId = entry?.linkedReviewId?.trim() ?? "";

  return linkedReviewId.length > 0;
}

/** RS-04: spawned drafts stay editor-locked; legacy localStorage acks are cleared and ignored. */
export function isArchitectureDraftHandoffAcknowledged(architectureId: string): boolean {
  const trimmedArchitectureId = architectureId.trim();

  if (trimmedArchitectureId.length === 0) {
    return false;
  }

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(`${ACK_STORAGE_PREFIX}${trimmedArchitectureId}`);
  }

  return false;
}

/** @deprecated RS-04 removed the post-spawn edit-anyway path. */
export function acknowledgeArchitectureDraftHandoff(architectureId: string, linkedReviewId: string): void {
  const trimmedArchitectureId = architectureId.trim();
  const trimmedLinkedReviewId = linkedReviewId.trim();

  if (trimmedArchitectureId.length === 0 || trimmedLinkedReviewId.length === 0) {
    return;
  }

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(`${ACK_STORAGE_PREFIX}${trimmedArchitectureId}`);
  }
}

export function clearArchitectureDraftHandoffAcknowledgment(architectureId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmedArchitectureId = architectureId.trim();

  if (trimmedArchitectureId.length === 0) {
    return;
  }

  window.localStorage.removeItem(`${ACK_STORAGE_PREFIX}${trimmedArchitectureId}`);
}

export function buildArchitectureDraftHandoffBannerTitle(linkedReviewTitle: string): string {
  const title = linkedReviewTitle.trim();

  if (title.length === 0) {
    return "This draft became a review — continue editing there.";
  }

  return `This draft became review “${title}” — continue editing there.`;
}

/** @deprecated RS-04 removed the post-spawn edit-anyway path. */
export function trackArchitectureDraftHandoffAcknowledged(architectureId: string, linkedReviewId: string): void {
  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent(
      { name: "ArchitectureDraftHandoffAcknowledged" },
      { architectureId, linkedReviewId },
    );
  });
}

/** Counts edits persisted after the user acknowledged post-spawn divergence (IA-007). */
export function trackArchitectureDraftPostSpawnEdit(architectureId: string, linkedReviewId: string): void {
  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent(
      { name: "ArchitectureDraftPostSpawnEdit" },
      { architectureId, linkedReviewId },
    );
  });
}

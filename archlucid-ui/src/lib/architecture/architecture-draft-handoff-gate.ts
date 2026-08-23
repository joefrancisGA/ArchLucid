import { ensureAppInsights } from "@/lib/telemetry";
import type { DraftRequestResponse } from "@/types/draft-intake";

const ACK_STORAGE_PREFIX = "archlucid.architecture_draft_handoff_ack.v1.";

export const ARCHITECTURE_DRAFT_HANDOFF_BANNER_LEAD =
  "This architecture draft already started a review. Continue in the review to evaluate evidence, findings, and exports.";

export const ARCHITECTURE_DRAFT_HANDOFF_ACKNOWLEDGE_LABEL =
  "Edit draft anyway — changes will not update the review";

export function architectureDraftSpawnedRunId(draft: DraftRequestResponse | null | undefined): string | null {
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

export function isArchitectureDraftHandoffAcknowledged(architectureId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const trimmedArchitectureId = architectureId.trim();

  if (trimmedArchitectureId.length === 0) {
    return false;
  }

  return window.localStorage.getItem(`${ACK_STORAGE_PREFIX}${trimmedArchitectureId}`) === "1";
}

export function acknowledgeArchitectureDraftHandoff(architectureId: string, linkedReviewId: string): void {
  const trimmedArchitectureId = architectureId.trim();
  const trimmedLinkedReviewId = linkedReviewId.trim();

  if (trimmedArchitectureId.length === 0 || trimmedLinkedReviewId.length === 0) {
    return;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(`${ACK_STORAGE_PREFIX}${trimmedArchitectureId}`, "1");
  }

  trackArchitectureDraftHandoffAcknowledged(trimmedArchitectureId, trimmedLinkedReviewId);
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

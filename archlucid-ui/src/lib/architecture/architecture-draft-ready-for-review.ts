import type { ArchitectureDraftCustomerStatus } from "@/lib/architecture/architecture-draft-status";

type DraftReadyProbe = {
  readonly linkedReviewId: string | null;
  readonly customerStatus: ArchitectureDraftCustomerStatus;
};

/** Drafts that can still start a review (not archived, no linked review yet). */
export function isArchitectureDraftEligibleToStartReview(entry: DraftReadyProbe): boolean {
  return entry.linkedReviewId === null && entry.customerStatus !== "archived";
}

/** Count of architectures eligible to start a review from the drafts registry. */
export function countArchitectureDraftsReadyForReview(entries: readonly DraftReadyProbe[]): number {
  return entries.filter(isArchitectureDraftEligibleToStartReview).length;
}

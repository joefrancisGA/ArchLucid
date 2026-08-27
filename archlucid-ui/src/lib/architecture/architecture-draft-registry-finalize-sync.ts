import {
  listArchitectureDraftRegistryEntries,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";

/** Ensures browser-local draft rows linked to a finalized review show review-linked status. */
export function syncArchitectureDraftRegistryForFinalizedReview(runId: string): void {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return;
  }

  for (const entry of listArchitectureDraftRegistryEntries()) {
    if (entry.linkedReviewId !== trimmedRunId) {
      continue;
    }

    if (entry.customerStatus === "review-linked") {
      continue;
    }

    upsertArchitectureDraftRegistryEntry({
      ...entry,
      customerStatus: "review-linked",
      linkedReviewId: trimmedRunId,
    });
  }
}

import { invalidateArchitectureDraftListQueries } from "@/lib/architecture/architecture-draft-list-client";

/** Refreshes server-backed draft inventory after a review finalizes and links a spawned run. */
export function syncArchitectureDraftRegistryForFinalizedReview(runId: string): void {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return;
  }

  void invalidateArchitectureDraftListQueries();
}

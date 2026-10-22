import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

/** Finds the local registry draft spawned from a committed review (LS-06 / R12). */
export function resolveLinkedDraftForReview(
  runId: string,
  drafts: readonly ArchitectureDraftRegistryEntry[],
): ArchitectureDraftRegistryEntry | null {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return null;
  }

  return (
    drafts.find((entry) => (entry.linkedReviewId?.trim() ?? "") === trimmedRunId) ?? null
  );
}

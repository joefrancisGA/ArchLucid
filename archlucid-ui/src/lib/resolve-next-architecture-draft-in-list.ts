import { architectureDraftPath } from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

export type ArchitectureDraftNextDraftTarget = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly href: string;
};

/** Next architecture draft in recency order after the current draft id. */
export function resolveNextArchitectureDraftInList(
  entries: readonly ArchitectureDraftRegistryEntry[],
  currentArchitectureId: string,
): ArchitectureDraftNextDraftTarget | null {
  const normalizedCurrentId = currentArchitectureId.trim();
  const sorted = [...entries].sort((left, right) => right.lastUpdatedUtc.localeCompare(left.lastUpdatedUtc));
  const currentIndex = sorted.findIndex((entry) => entry.draftId === normalizedCurrentId);

  if (currentIndex < 0) {
    return null;
  }

  const nextDraft = sorted[currentIndex + 1];

  if (nextDraft === undefined) {
    return null;
  }

  return {
    architectureId: nextDraft.draftId,
    displayName: nextDraft.displayName,
    href: architectureDraftPath(nextDraft.draftId),
  };
}

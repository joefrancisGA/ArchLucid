import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { buildDraftIdToArchitectureIdLookup } from "@/lib/global-search-architecture-hits";
import type { ArchitectureIdentityListItem } from "@/types/architecture-identity";

export function buildShareVisibleArchitectureIds(
  identities: readonly ArchitectureIdentityListItem[],
): ReadonlySet<string> {
  const visibleArchitectureIds = new Set<string>();

  for (const identity of identities) {
    const architectureId = identity.architectureId.trim();

    if (architectureId.length > 0) {
      visibleArchitectureIds.add(architectureId);
    }
  }

  return visibleArchitectureIds;
}

/**
 * AS-094: intersect draft registry rows with GET /v1/architectures share-filtered visibility.
 * Server is source of truth — do not reimplement share SQL in the browser.
 */
export function filterDraftRegistryEntriesByShareVisibility(
  entries: readonly ArchitectureDraftRegistryEntry[],
  visibleIdentities: readonly ArchitectureIdentityListItem[],
): readonly ArchitectureDraftRegistryEntry[] {
  const visibleArchitectureIds = buildShareVisibleArchitectureIds(visibleIdentities);
  const draftIdToArchitectureId = buildDraftIdToArchitectureIdLookup(visibleIdentities);

  return entries.filter((entry) => isDraftRegistryEntryShareVisible(entry, visibleArchitectureIds, draftIdToArchitectureId));
}

export function isDraftRegistryEntryShareVisible(
  entry: ArchitectureDraftRegistryEntry,
  visibleArchitectureIds: ReadonlySet<string>,
  draftIdToArchitectureId: ReadonlyMap<string, string>,
): boolean {
  const parentArchitectureId = entry.parentArchitectureId?.trim() ?? "";

  if (parentArchitectureId.length > 0 && !visibleArchitectureIds.has(parentArchitectureId)) {
    return false;
  }

  const draftId = entry.draftId.trim();
  const mappedArchitectureId = draftIdToArchitectureId.get(draftId)?.trim() ?? "";

  if (mappedArchitectureId.length > 0) {
    return visibleArchitectureIds.has(mappedArchitectureId);
  }

  return true;
}

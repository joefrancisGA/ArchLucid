import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  architectureDraftPath,
  architectureIdentityDraftHref,
  architectureIdentityPath,
} from "@/lib/architecture/architecture-routes";
import { filterArchitectureIdentitiesForPaletteSearch } from "@/lib/command-palette-architecture-identities-search";
import type { ArchitectureIdentityListItem } from "@/types/architecture-identity";

const GLOBAL_SEARCH_ARCHITECTURE_MATCH_LIMIT = 6;

export type GlobalSearchArchitectureIdentityHit = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly href: string;
};

export type GlobalSearchArchitectureDraftHit = {
  readonly draftId: string;
  readonly displayName: string;
  readonly href: string;
};

function normalizedSearchTokens(search: string): readonly string[] {
  return search
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function architectureDraftRegistryEntryMatchesSearch(
  entry: ArchitectureDraftRegistryEntry,
  tokens: readonly string[],
): boolean {
  if (tokens.length === 0) {
    return false;
  }

  const haystack = `${entry.displayName} ${entry.draftId}`.toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

/** Maps identity list child draft ids to durable architecture ids for draft child URLs. */
export function buildDraftIdToArchitectureIdLookup(
  identities: readonly ArchitectureIdentityListItem[],
): ReadonlyMap<string, string> {
  const lookup = new Map<string, string>();

  for (const identity of identities) {
    const draftId = identity.currentDraftId?.trim() ?? "";

    if (draftId.length === 0) {
      continue;
    }

    lookup.set(draftId, identity.architectureId);
  }

  return lookup;
}

export function resolveGlobalSearchDraftHref(
  entry: ArchitectureDraftRegistryEntry,
  draftIdToArchitectureId: ReadonlyMap<string, string>,
): string {
  const draftId = entry.draftId.trim();
  const architectureId = draftIdToArchitectureId.get(draftId)?.trim() ?? "";

  if (architectureId.length > 0) {
    return architectureIdentityDraftHref(architectureId, draftId);
  }

  return architectureDraftPath(draftId);
}

/** CA-42: in-scope architecture identity rows from the CA-11 list — display name only, not draft bodies. */
export function filterGlobalSearchArchitectureIdentityHits(
  identities: readonly ArchitectureIdentityListItem[],
  search: string,
): readonly GlobalSearchArchitectureIdentityHit[] {
  return filterArchitectureIdentitiesForPaletteSearch(identities, search).map((item) => ({
    architectureId: item.architectureId,
    displayName: item.displayName,
    href: architectureIdentityPath(item.architectureId),
  }));
}

/** CA-42: draft title hits labeled separately from identity desks — never searches draft document bodies. */
export function filterGlobalSearchArchitectureDraftHits(
  entries: readonly ArchitectureDraftRegistryEntry[],
  search: string,
  draftIdToArchitectureId: ReadonlyMap<string, string>,
): readonly GlobalSearchArchitectureDraftHit[] {
  const tokens = normalizedSearchTokens(search);

  if (tokens.length === 0) {
    return [];
  }

  return entries
    .filter((entry) => entry.customerStatus !== "archived")
    .filter((entry) => architectureDraftRegistryEntryMatchesSearch(entry, tokens))
    .slice(0, GLOBAL_SEARCH_ARCHITECTURE_MATCH_LIMIT)
    .map((entry) => ({
      draftId: entry.draftId,
      displayName: entry.displayName,
      href: resolveGlobalSearchDraftHref(entry, draftIdToArchitectureId),
    }));
}

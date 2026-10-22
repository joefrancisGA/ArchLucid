import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  filterDraftRegistryEntriesByShareVisibility,
  isDraftRegistryEntryShareVisible,
} from "@/lib/architecture/share-visible-architecture-inventory";
import { buildDraftIdToArchitectureIdLookup } from "@/lib/global-search-architecture-hits";
import type { ArchitectureIdentityListItem } from "@/types/architecture-identity";

const visibleIdentities: readonly ArchitectureIdentityListItem[] = [
  {
    architectureId: "architecture-open-001",
    displayName: "Open package",
    updatedUtc: "2026-01-01T00:00:00Z",
    currentDraftId: "draft-open-1",
    draftCount: 1,
    reviewCount: 0,
  },
];

function draftEntry(
  overrides: Partial<ArchitectureDraftRegistryEntry> & Pick<ArchitectureDraftRegistryEntry, "draftId">,
): ArchitectureDraftRegistryEntry {
  return {
    displayName: overrides.displayName ?? "Draft",
    customerStatus: overrides.customerStatus ?? "draft",
    ownerLabel: "You",
    lastUpdatedUtc: "2026-01-01T00:00:00Z",
    linkedReviewId: null,
    serverUpdatedUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("share-visible-architecture-inventory (AS-094)", () => {
  it("drops drafts whose parent architecture is absent from the share-filtered identity list", () => {
    const entries = [
      draftEntry({
        draftId: "draft-restricted-1",
        displayName: "Secret platform",
        parentArchitectureId: "architecture-restricted-001",
      }),
      draftEntry({
        draftId: "draft-open-1",
        displayName: "Open platform",
        parentArchitectureId: "architecture-open-001",
      }),
    ];

    expect(filterDraftRegistryEntriesByShareVisibility(entries, visibleIdentities)).toEqual([
      entries[1],
    ]);
  });

  it("drops drafts mapped through currentDraftId when the identity row is absent", () => {
    const lookup = buildDraftIdToArchitectureIdLookup(visibleIdentities);
    const visibleArchitectureIds = new Set(["architecture-open-001"]);
    const restrictedEntry = draftEntry({
      draftId: "draft-restricted-2",
      displayName: "Hidden child draft",
    });

    expect(
      isDraftRegistryEntryShareVisible(
        restrictedEntry,
        visibleArchitectureIds,
        new Map([["draft-restricted-2", "architecture-restricted-001"]]),
      ),
    ).toBe(false);

    expect(isDraftRegistryEntryShareVisible(restrictedEntry, visibleArchitectureIds, lookup)).toBe(true);
  });

  it("keeps legacy drafts without a parent architecture id", () => {
    const entries = [
      draftEntry({
        draftId: "draft-legacy-1",
        displayName: "Legacy draft",
      }),
    ];

    expect(filterDraftRegistryEntriesByShareVisibility(entries, visibleIdentities)).toEqual(entries);
  });
});

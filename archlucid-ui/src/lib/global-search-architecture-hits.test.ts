import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  buildDraftIdToArchitectureIdLookup,
  filterGlobalSearchArchitectureDraftHits,
  filterGlobalSearchArchitectureIdentityHits,
  resolveGlobalSearchDraftHref,
} from "@/lib/global-search-architecture-hits";
import type { ArchitectureIdentityListItem } from "@/types/architecture-identity";

const identities: readonly ArchitectureIdentityListItem[] = [
  {
    architectureId: "architecture-identity-001",
    displayName: "Payments platform",
    updatedUtc: "2026-01-01T00:00:00Z",
    currentDraftId: "draft-payments-1",
    draftCount: 1,
    reviewCount: 1,
  },
  {
    architectureId: "architecture-identity-002",
    displayName: "Claims intake",
    updatedUtc: "2026-01-02T00:00:00Z",
    currentDraftId: null,
    draftCount: 0,
    reviewCount: 0,
  },
];

function draftEntry(
  overrides: Partial<ArchitectureDraftRegistryEntry> & Pick<ArchitectureDraftRegistryEntry, "draftId" | "displayName">,
): ArchitectureDraftRegistryEntry {
  return {
    customerStatus: "draft",
    ownerLabel: "You",
    lastUpdatedUtc: "2026-01-01T00:00:00Z",
    linkedReviewId: null,
    serverUpdatedUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("global-search-architecture-hits (CA-42)", () => {
  it("maps identity display-name matches to the architecture desk href", () => {
    const hits = filterGlobalSearchArchitectureIdentityHits(identities, "payments");

    expect(hits).toEqual([
      {
        architectureId: "architecture-identity-001",
        displayName: "Payments platform",
        href: "/architecture/architectures/architecture-identity-001",
      },
    ]);
  });

  it("returns draft hits on title match with child URLs when linked to an identity", () => {
    const lookup = buildDraftIdToArchitectureIdLookup(identities);
    const hits = filterGlobalSearchArchitectureDraftHits(
      [
        draftEntry({
          draftId: "draft-payments-1",
          displayName: "Payments platform",
        }),
      ],
      "payments",
      lookup,
    );

    expect(hits).toEqual([
      {
        draftId: "draft-payments-1",
        displayName: "Payments platform",
        href: "/architecture/architectures/architecture-identity-001?draft=draft-payments-1",
      },
    ]);
  });

  it("keeps identity and draft hits separate when titles match", () => {
    const lookup = buildDraftIdToArchitectureIdLookup(identities);
    const identityHits = filterGlobalSearchArchitectureIdentityHits(identities, "payments platform");
    const draftHits = filterGlobalSearchArchitectureDraftHits(
      [
        draftEntry({
          draftId: "draft-payments-1",
          displayName: "Payments platform",
        }),
      ],
      "payments platform",
      lookup,
    );

    expect(identityHits).toHaveLength(1);
    expect(draftHits).toHaveLength(1);
    expect(identityHits[0]?.href).toBe("/architecture/architectures/architecture-identity-001");
    expect(draftHits[0]?.href).toContain("?draft=draft-payments-1");
  });

  it("falls back to legacy draft paths when no identity link is known", () => {
    const entry = draftEntry({
      draftId: "draft-legacy-1",
      displayName: "Legacy draft",
    });

    expect(resolveGlobalSearchDraftHref(entry, new Map())).toBe(
      "/architecture/architectures/draft-legacy-1",
    );
  });

  it("never returns archived drafts", () => {
    const hits = filterGlobalSearchArchitectureDraftHits(
      [
        draftEntry({
          draftId: "draft-archived",
          displayName: "Archived draft",
          customerStatus: "archived",
        }),
      ],
      "archived",
      new Map(),
    );

    expect(hits).toEqual([]);
  });

  it("does not return identity rows when search is empty", () => {
    expect(filterGlobalSearchArchitectureIdentityHits(identities, "")).toEqual([]);
    expect(filterGlobalSearchArchitectureDraftHits([], "", new Map())).toEqual([]);
  });
});
